import { redirect } from "next/navigation";

export default function RedirectAnalise({ params }: { params: { id: string } }) {
  redirect(`/clientes/${params.id}`);
}
