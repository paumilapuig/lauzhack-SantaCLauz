import { StudentPage } from "@/components/student-page"
import { HomeReview } from "./home-review"

export default function HomePage() {
  return (
    <StudentPage title="Para repasar" lead="Lo que se te escapó hoy en clase, con la voz de tu profe">
      <HomeReview />
    </StudentPage>
  )
}
