import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useParams } from 'react-router-dom'

const SportsPage = () => {

  const { id } = useParams()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-semibold text-slate-800 mb-2">Sports {id}</h1>
      <p className="text-base text-slate-400">Sports Page placeholder</p>
    </div>
  )
}

export default SportsPage
