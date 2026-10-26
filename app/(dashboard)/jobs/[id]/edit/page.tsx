import JobForm from "@/components/JobForm";
export default function EditJob({ params }: { params: { id: string } }) { return <JobForm jobId={params.id} />; }
