import { ProgressHero } from "@/components/progress-hero"
import { ProgressMessage } from "@/components/progress-message"
import { StudentPage } from "@/components/student-page"
import { getProgress } from "@/app/home/data"

export default async function ProgressPage() {
  const { messages } = await getProgress()
  const hero = messages.find((m) => m.kind === "learned_this_week")
  const rest = messages.filter((m) => m !== hero)

  return (
    <StudentPage title="Progreso" context="esta semana" lead="Frases sobre lo que ya no necesitas, nunca un porcentaje.">
      <div className="flex flex-col gap-10">
        {hero && <ProgressHero message={hero} />}
        <ul className="flex flex-col divide-y divide-separator rounded-[24px] border border-border bg-card px-5">
          {rest.map((message) => (
            <li key={message.kind}>
              <ProgressMessage message={message} />
            </li>
          ))}
        </ul>
      </div>
    </StudentPage>
  )
}
