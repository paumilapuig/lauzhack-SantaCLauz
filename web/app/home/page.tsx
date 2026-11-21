import { StudentNav } from "@/components/student-nav"
import { HomeReview } from "./home-review"

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-6 md:px-6">
      <StudentNav />
      <main className="mt-6 flex flex-col gap-8">
        <h1 className="text-[32px] font-bold">Para repasar</h1>
        <HomeReview />
      </main>
    </div>
  )
}
