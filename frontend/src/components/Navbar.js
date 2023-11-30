import React from 'react';

import { Link } from 'react-router-dom'

export const Navbar = () => {
  return (
    <header>
        <div classname='container'>
            <Link to='/'>
                <h1>Workout App</h1>
            </Link>
        </div>
    </header>
  )
}
