import icon1 from '../assets/sportIcons/icon1.png'
import icon2 from '../assets/sportIcons/icon2.png'
import icon3 from '../assets/sportIcons/icon3.png'
import icon4 from '../assets/sportIcons/icon4.png'
import icon5 from '../assets/sportIcons/icon5.jpg'
import icon6 from '../assets/sportIcons/icon6.jpg'
import icon7 from '../assets/sportIcons/icon7.jpg'
import icon8 from '../assets/sportIcons/icon8.jpg'
import icon9 from '../assets/sportIcons/icon9.png'
import icon10 from '../assets/sportIcons/icon10.jpg'
import icon11 from '../assets/sportIcons/icon11.jpg'
import icon12 from '../assets/sportIcons/icon12.jpg'

export const commonSports = [
  { name: 'Football', icon: icon1, path: '/sports/football' },
  { name: 'Basketball', icon: icon2, path: '/sports/basketball' },
  { name: 'Badminton', icon: icon3, path: '/sports/badminton' },
  { name: 'Ping Pong', icon: icon4, path: '/sports/ping-pong' },
  { name: 'Running', icon: icon5, path: '/sports/running' },
  { name: 'Bowling', icon: icon6, path: '/sports/bowling' },
]

export const eSports = [
  { name: 'League of Legends', icon: icon7, path: '/sports/league-of-legends' },
  { name: 'Valorant', icon: icon8, path: '/sports/valorant' },
  { name: 'Dota 2', icon: icon9, path: '/sports/dota-2' },
  { name: 'Counter Strike 2', icon: icon10, path: '/sports/counter-strike-2' },
  { name: 'Teamfight Tactics', icon: icon11, path: '/sports/teamfight-tactics' },
  { name: 'Programming', icon: icon12, path: '/sports/programming' },
]

export const allSports = [...commonSports, ...eSports]
