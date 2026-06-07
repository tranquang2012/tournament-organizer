import { Outlet } from 'react-router-dom'
import TopNavBar from './TopNavbar'
import PublicFooter from './PublicFooter'

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <TopNavBar />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
