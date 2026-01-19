import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ice flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-teal">TruGovAI</span>
              <span className="text-sm text-gray-300 hidden sm:inline">
                Employee AI Survey
              </span>
            </div>
            <Link
              href="/admin/login"
              className="btn btn-primary text-sm py-2 px-4"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-6">
            Discover Shadow AI in Your Organization
          </h1>
          <p className="text-xl text-slate mb-8">
            Purpose-built survey tool for AI governance. Understand how employees use AI tools,
            identify risks, and feed results directly into your governance workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin/login" className="btn btn-primary text-lg px-8">
              Get Started
            </Link>
            <a
              href="#features"
              className="btn btn-secondary text-lg px-8"
            >
              Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="Smart Surveys"
              description="Pre-built questions with conditional logic. Employees only see relevant questions."
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Auto Analytics"
              description="Instant charts, risk flags, and department breakdowns. No manual analysis needed."
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              title="Risk Detection"
              description="Automatically identify sensitive data exposure and unapproved tool usage."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              number={1}
              title="Create Survey"
              description="Configure your survey with the settings you need"
            />
            <StepCard
              number={2}
              title="Share Link"
              description="Distribute the survey link to employees via email or Slack"
            />
            <StepCard
              number={3}
              title="Collect Responses"
              description="Employees complete the survey on any device"
            />
            <StepCard
              number={4}
              title="Review Analytics"
              description="See instant insights and export reports for leadership"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-teal font-bold mb-2">TruGovAI™</p>
          <p className="text-sm text-gray-400">
            Part of the TruGovAI™ Toolkit — "Board-ready AI governance in 30 days"
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card text-center">
      <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 text-teal">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-slate">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-slate text-sm">{description}</p>
    </div>
  );
}
