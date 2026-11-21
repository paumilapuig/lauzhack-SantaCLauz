import { ProgressHero } from "@/components/progress-hero"
import { ProgressMessage } from "@/components/progress-message"
import { StudentPage } from "@/components/student-page"
import { getProgress } from "@/app/home/data"

export default async function ProgressPage() {
  const { messages } = await getProgress()
  const hero = messages.find((m) => m.kind === "learned_this_week")
  const rest = messages.filter((m) => m !== hero)

  return (
    <StudentPage title="Tu progreso" lead="Cada palabra que dominas deja de necesitar ayuda en clase">
      {hero && <ProgressHero message={hero} />}
      <ul className="grid gap-6 md:grid-cols-2">
        {rest.map((message) => (
          <li key={message.kind}>
            <ProgressMessage message={message} />
          </li>
        ))}
      </ul>
    </StudentPage>
  )
}
