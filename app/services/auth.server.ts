// Fork of @coursetable/passport-cas that works with Remix

import { v4 as uuidV4 } from "uuid";
import { redirect } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { Strategy as BaseStrategy } from "remix-auth/strategy";
import { parseString, processors } from "xml2js";

type CasInfo = {
  user: string;
  attributes?: {
    [key in string]: string | string[];
  };
};
type VersionOptions =
  | "CAS1.0"
  | "CAS2.0"
  | "CAS2.0-with-saml"
  | "CAS3.0"
  | "CAS3.0-with-saml";

const parseXmlString = (xml: string): Promise<any> => {
  const xmlParseOpts = {
    trim: true,
    normalize: true,
    explicitArray: false,
    tagNameProcessors: [processors.normalize, processors.stripPrefix],
  };
  return new Promise<any>((resolve, reject) => {
    parseString(xml, xmlParseOpts, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

const validateResponseCas1 = async (body: string): Promise<CasInfo> => {
  const lines = body.split("\n");
  if (lines.length >= 1) {
    if (lines[0] === "no") {
      throw new Error("Authentication rejected");
    } else if (lines[0] === "yes" && lines.length >= 2) {
      const profile: CasInfo = {
        user: lines[1],
      };
      return profile;
    }
  }
  throw new Error("The response from the server was bad");
};
const validateResponseCas3 = async (body: string): Promise<CasInfo> => {
  const result = await parseXmlString(body);

  try {
    if (result.serviceresponse.authenticationfailure) {
      throw new Error(
        "Authentication failed " +
          result.serviceresponse.authenticationfailure.$.code,
      );
    }
    const success = result.serviceresponse.authenticationsuccess;
    if (success) {
      return success;
    }
    throw new Error("Authentication failed but success present");
  } catch (e) {
    throw new Error("Authentication failed - XML parsing issue");
  }
};
const validateResponseCas3saml = async (body: string): Promise<CasInfo> => {
  const result = await parseXmlString(body);

  try {
    const response = result.envelope.body.response;
    const success = response.status.statuscode["$"].Value.match(/Success$/);
    if (success) {
      const attributes: NonNullable<CasInfo["attributes"]> = {};
      Object.values(response.assertion.attributestatement.attribute).forEach(
        (attribute: any) => {
          attributes[attribute["$"].AttributeName.toLowerCase()] =
            attribute.attributevalue;
        },
      );
      const profile: CasInfo = {
        user: response.assertion.authenticationstatement.subject.nameidentifier,
        attributes,
      };
      return profile;
    }
    throw new Error("Authentication failed");
  } catch (e) {
    throw new Error("Authentication failed");
  }
};

class CasStrategy<User> extends BaseStrategy<User, CasInfo> {
  name = "cas";

  #version: VersionOptions;
  #ssoBaseURL: string;
  #serverBaseURL?: string;
  #validateURL: string;
  #callbackURL?: string;

  constructor(
    verify: BaseStrategy.VerifyFunction<User, CasInfo>,
    options: {
      version?: VersionOptions;
      ssoBaseURL: string;
      serverBaseURL?: string;
      validateURL?: string;
      callbackURL?: string;
    },
  ) {
    super(verify);

    this.#version = options.version ?? "CAS1.0";
    this.#ssoBaseURL = options.ssoBaseURL;
    this.#serverBaseURL = options.serverBaseURL;
    this.#callbackURL = options.callbackURL;

    this.#validateURL =
      options.validateURL ??
      (() => {
        switch (this.#version) {
          case "CAS1.0":
            return "/validate";
          case "CAS2.0":
            return "/serviceValidate";
          case "CAS3.0":
            return "/p3/serviceValidate";
          case "CAS2.0-with-saml":
          case "CAS3.0-with-saml":
            return "/samlValidate";
          default:
            const _exhaustiveCheck: never = this.#version;
            throw new Error("unsupported version " + this.#version);
        }
      })();
  }

  override async authenticate(req: Request): Promise<User> {
    const service = this.service(req);
    const reqURL = new URL(req.url);
    const ticket = reqURL.searchParams.get("ticket");
    if (!ticket) {
      const redirectURL = new URL(this.#ssoBaseURL + "/login");
      // Copy query parameters from original request.
      redirectURL.search = reqURL.search;
      redirectURL.searchParams.set("service", service);
      throw redirect(redirectURL.toString(), 302);
    }

    let resXML: string;
    if (
      this.#version === "CAS3.0-with-saml" ||
      this.#version === "CAS2.0-with-saml"
    ) {
      const requestId = uuidV4();
      const issueInstant = new Date().toISOString();
      const soapEnvelope = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body><samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" MajorVersion="1" MinorVersion="1" RequestID="${requestId}" IssueInstant="${issueInstant}"><samlp:AssertionArtifact>${ticket}</samlp:AssertionArtifact></samlp:Request></SOAP-ENV:Body></SOAP-ENV:Envelope>`;

      resXML = await fetch(
        `${this.#ssoBaseURL}${this.#validateURL}?TARGET=${service}`,
        {
          method: "POST",
          body: soapEnvelope,
          headers: {
            "Content-Type": "text/xml",
          },
        },
      ).then((response) => response.text());
    } else {
      resXML = await fetch(
        `${this.#ssoBaseURL}${this.#validateURL}?ticket=${ticket}&service=${service}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "text/xml",
          },
        },
      ).then((response) => response.text());
    }
    const casInfo = await (() => {
      switch (this.#version) {
        case "CAS1.0":
          return validateResponseCas1(resXML);
        case "CAS2.0":
        case "CAS3.0":
          return validateResponseCas3(resXML);
        case "CAS2.0-with-saml":
        case "CAS3.0-with-saml":
          return validateResponseCas3saml(resXML);
        default:
          const _exhaustiveCheck: never = this.#version;
          throw new Error("unsupported version " + this.#version);
      }
    })();

    return await this.verify(casInfo);
  }

  /**
   * Generate the "service" parameter for the CAS callback URL.
   */
  private service(req: Request): string {
    let baseUrl;
    if (this.#serverBaseURL) {
      baseUrl = this.#serverBaseURL;
    } else if (req.headers.has("x-forwarded-host")) {
      // We need to include this in Express <= v4, since the behavior
      // is to strip the port number by default. This is fixed in Express v5.

      // First, determine host + port.
      const forwardHeader = req.headers.get("x-forwarded-host")!;
      const host = forwardHeader.split(",")[0];

      // Then, determine proto used. We default to http here.
      const forwardProto = req.headers.get("x-forwarded-proto");
      const proto = forwardProto ? forwardProto.split(",")[0] : "http";

      baseUrl = `${proto}://${host}`;
    } else if (req.headers.has("host")) {
      // Fallback to "HOST" header.
      baseUrl = `${new URL(req.url).protocol}//${req.headers.get("host")!}`;
    } else {
      // Final fallback is to req.hostname, generated by Express. As mentioned
      // above, this won't have a port number and so we attempt to use it last.
      baseUrl = `${new URL(req.url).protocol}//${new URL(req.url).hostname}`;
    }

    const serviceURL = this.#callbackURL || new URL(req.url).href;
    const resolvedURL = new URL(serviceURL, baseUrl);
    resolvedURL.search = "";
    return resolvedURL.toString();
  }
}

export const authenticator = new Authenticator<void>();

authenticator.use(
  new CasStrategy(
    async (user) => {
      console.log(user);
    },
    {
      version: "CAS2.0",
      ssoBaseURL: "https://secure.its.yale.edu/cas",
    },
  ),
);
