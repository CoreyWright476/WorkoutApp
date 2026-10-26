import React from 'react';

import { Link, NavLink } from 'react-router-dom'

export const Navbar = () => {
  return (
    <header>
        <div className='container'>
            <Link to='/'>
                <h1>Workout App</h1>
            </Link>
            <nav>
                <NavLink to='/' end>Dashboard</NavLink>
                <NavLink to='/log'>Log workout</NavLink>
                <NavLink to='/plans'>Plans</NavLink>
                <NavLink to='/exercises'>Exercises</NavLink>
            </nav>
        </div>
    </header>
  )
}
