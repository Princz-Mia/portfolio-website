import Hero from '../components/Hero'
import About from '../components/About'
import AppearAnimation from '../components/AppearAnimation'
import Technologies from '../components/Technologies'
import Education from '../components/Education'
import Projects from '../components/Projects'

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
      <AppearAnimation>
        <Education />
      </AppearAnimation>
    </div>
  )
}

export default Home