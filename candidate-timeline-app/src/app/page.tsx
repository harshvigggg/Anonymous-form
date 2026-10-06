import Link from 'next/link'

/** Entry page for the team. Candidates always arrive through their personal link. */
export default function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-4 py-16">
      <p className="text-[15px] font-semibold text-brand-dark">Germany Nursing Profile</p>
      <h1 className="mt-2 text-[30px] font-bold leading-tight">Education &amp; work timeline</h1>
      <p className="mt-3 text-muted">
        A guided form that helps nursing candidates enter their school, nursing education, jobs and breaks without gaps or spelling mistakes.
        Executives only review the exceptions.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/candidate/demo" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-brand px-5 font-semibold text-white">
          Try the sample candidate
        </Link>
        <Link href="/admin" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-brand-line px-5 font-semibold text-brand-dark">
          Executive review
        </Link>
      </div>
      <p className="mt-8 text-[14px] text-muted">Candidates receive a personal link from the executive review page.</p>
    </main>
  )
}
