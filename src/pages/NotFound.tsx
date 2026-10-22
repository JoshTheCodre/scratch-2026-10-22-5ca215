import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="container page-simple">
      <EmptyState
        icon={MapPinOff}
        title="We couldn't find that page"
        text="The advert may have been removed, or the link is wrong."
        action={
          <Link to="/" className="btn btn-primary">
            Go to homepage
          </Link>
        }
      />
    </div>
  )
}
