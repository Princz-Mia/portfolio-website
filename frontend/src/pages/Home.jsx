import About from '../components/About'
import AppearAnimation from '../components/AppearAnimation'
import Hero from '../components/Hero'
import Technologies from '../components/Technologies'

const Home = () => {
  return (
    <div className='w-screen'>
      <Hero />
      <AppearAnimation>
        <About />
      </AppearAnimation>
      <AppearAnimation>
        <Technologies />
      </AppearAnimation>
    </div>
  )
}

export default Home