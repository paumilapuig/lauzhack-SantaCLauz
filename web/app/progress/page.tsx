import { ProgressMessage } from "@/components/progress-message"
import { StudentNav } from "@/components/student-nav"
import { getProgress } from "@/app/home/data"

export default async function ProgressPage() {
  const { messages } = await getProgress()
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-6 md:px-6">
      <StudentNav />
      <main className="mt-6 flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">Tu progreso</h1>
        <ul className="flex flex-col gap-4">
          {messages.map((message) => (
            <li key={message.kind}>
              <ProgressMessage message={message} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
