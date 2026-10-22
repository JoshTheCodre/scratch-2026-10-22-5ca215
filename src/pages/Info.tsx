import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Breadcrumbs, SAFETY_TIPS } from '../components/ui'

type Kind = 'about' | 'safety' | 'terms' | 'privacy'

const TITLES: Record<Kind, string> = {
  about: 'About House4Rent.ng',
  safety: 'Safety tips',
  terms: 'Terms & conditions',
  privacy: 'Privacy policy',
}

// Placeholder copy — replace with reviewed legal text before launch.
export default function Info({ kind }: { kind: Kind }) {
  return (
    <div className="container page-simple narrow">
      <Breadcrumbs items={[{ label: 'House4Rent', to: '/' }, { label: TITLES[kind] }]} />
      <article className="card prose">
        <h1>{TITLES[kind]}</h1>
        {kind === 'about' && (
          <>
            <p>
              House4Rent.ng is a marketplace only for property: homes and apartments to rent or buy, land and plots, short lets, new builds, commercial buildings and event
              spaces. Owners, agents and developers post adverts; renters, buyers and investors contact them directly.
            </p>
            <p>We focus on clear prices, verified sellers and honest photos so you spend less on wasted inspections.</p>
            <Link to="/sell" className="btn btn-accent">
              Post a property
            </Link>
          </>
        )}
        {kind === 'safety' && (
          <>
            <p className="lead">
              <ShieldCheck size={20} /> Most property scams can be avoided with a few habits.
            </p>
            <ol>
              {SAFETY_TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
              <li>For land, do a search at the state land registry and confirm the survey plan with the Surveyor-General's office.</li>
              <li>Pay into company accounts where possible and always collect a receipt and signed agreement.</li>
            </ol>
            <p>
              See something suspicious? Use <strong>Report abuse</strong> on the advert page and our team will review it.
            </p>
          </>
        )}
        {kind === 'terms' && (
          <>
            <p>These demo terms are a placeholder. Before launch, replace them with terms reviewed by a Nigerian legal adviser covering:</p>
            <ul>
              <li>Who may post adverts and seller verification requirements</li>
              <li>Prohibited content (fake listings, duplicate adverts, misleading prices)</li>
              <li>Fees for promoted adverts and refund rules</li>
              <li>Limits of the platform's liability for transactions between users</li>
            </ul>
          </>
        )}
        {kind === 'privacy' && (
          <>
            <p>This demo stores your profile, saved adverts, posted adverts and chats only in your browser's local storage. Nothing is sent to a server.</p>
            <p>Before launch, replace this page with a policy compliant with the Nigeria Data Protection Act (NDPA) 2023.</p>
          </>
        )}
      </article>
    </div>
  )
}
