import { Outlet } from 'react-router-dom'
import TopNavBar from './TopNavbar'
import PublicFooter from './PublicFooter'

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNavBar />
      <main className='flex-1'>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
