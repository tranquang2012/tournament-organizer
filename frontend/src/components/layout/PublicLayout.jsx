import { Outlet } from 'react-router-dom'
import TopNavBar from './TopNavbar'

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <TopNavBar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default PublicLayout
