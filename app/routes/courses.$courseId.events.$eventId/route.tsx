import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderFunctionArgs) {
  return { courseId: params.courseId };
}

export default function EventLanding() {
  const data = useLoaderData<typeof loader>();
  return `${data.courseId} events`;
}
