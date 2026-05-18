import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

//import components
import SignIn from './components/authentication/Signin.jsx'

const App = () => {

  return (
    <>
      <SignIn />
    </>
  )
}

export default App;
