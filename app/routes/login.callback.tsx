import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { parseString, processors } from "xml2js";
import { sessionStorage } from "~/services/session.server";

type CasInfo = {
  user: string;
  attributes?: {
    [key in string]: string | string[];
  };
};

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

const validateResponseCas3 = async (body: string): Promise<CasInfo> => {
  const result = await parseXmlString(body);
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
};

export async function loader({ request }: LoaderFunctionArgs) {
  const ticket = new URL(request.url).searchParams.get("ticket")!;
  const validateURL = new URL(
    "https://secure.its.yale.edu/cas/p3/serviceValidate",
  );
  validateURL.searchParams.set("ticket", ticket);
  validateURL.searchParams.set(
    "service",
    `${process.env.ORIGIN}/login/callback`,
  );
  const casInfo = await fetch(validateURL, {
    method: "GET",
    headers: {
      "Content-Type": "text/xml",
    },
  })
    .then((response) => response.text())
    .then(validateResponseCas3);
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  session.set("user", casInfo.user);

  throw redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}
