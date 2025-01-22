import {
  type ActionFunction,
  type LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { eq } from "drizzle-orm";
import { parseString, processors } from "xml2js";
import { users } from "~/services/db-schema.server";
import { db } from "~/services/db.server";
import { sessionStorage, type SessionData } from "~/services/session.server";

type CasInfo = {
  user: string;
  attributes?: {
    [key in string]: string | string[];
  };
};

export type YaliesResponse =
  | {
      organization_code?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      upi?: number;
      school?: string;
      year?: number;
      college?: string;
      major?: string;
      curriculum?: string;
      school_code?: string;
    }[]
  | null;

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

// The workflow for CAS authentication is as follows:
// 1. POST /login
// 2. The action function redirects to the CAS login page, passing /login as
//    the service URL
// 3. The user logs in on the CAS login page, which redirects back to the same
//    URL with a ticket query parameter
// 4. The loader function validates the ticket with the CAS server and gets the
//    netID back, which we store in the session
export const action: ActionFunction = async ({ request }) => {
  const redirectURL = new URL("https://secure.its.yale.edu/cas/login");
  // Copy query parameters from original request.
  redirectURL.search = new URL(request.url).search;
  redirectURL.searchParams.set("service", `${process.env.ORIGIN}/login`);
  throw redirect(redirectURL.toString(), 302);
};

async function getUserData(netId: string): Promise<SessionData["user"] | null> {
  const existingData = await db
    .select({
      netId: users.netId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      year: users.year,
      role: users.role,
    })
    .from(users)
    .where(eq(users.netId, netId));
  if (existingData.length > 0) return existingData[0];
  const data = (await fetch("https://yalies.io/api/people", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.YALIES_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filters: {
        netid: netId,
      },
    }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  })) as YaliesResponse;
  // If no user found, only use existing data
  if (data === null || data.length === 0) {
    return null;
  }
  const yaliesUserData = data[0]!;
  if (
    !yaliesUserData.first_name ||
    !yaliesUserData.last_name ||
    !yaliesUserData.email
  ) {
    return null;
  }
  const user: SessionData["user"] = {
    netId,
    firstName: yaliesUserData.first_name,
    lastName: yaliesUserData.last_name,
    email: yaliesUserData.email,
    year: yaliesUserData.year ?? null,
    role: "student",
  };
  await db.insert(users).values(user);
  return user;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const ticket = new URL(request.url).searchParams.get("ticket")!;
  const validateURL = new URL(
    "https://secure.its.yale.edu/cas/p3/serviceValidate",
  );
  validateURL.searchParams.set("ticket", ticket);
  validateURL.searchParams.set("service", `${process.env.ORIGIN}/login`);
  const casInfo = await fetch(validateURL, {
    method: "GET",
    headers: { "Content-Type": "text/xml" },
  })
    .then((response) => response.text())
    .then(validateResponseCas3);
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const userData = await getUserData(casInfo.user);
  if (userData) {
    session.set("user", userData);
    throw redirect("/", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  } else {
    session.set("incumbentUser", casInfo.user);
    throw redirect("/onboard", {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  }
}
