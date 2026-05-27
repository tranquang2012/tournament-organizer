import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './UserProfileManagement.css'

//import component
import TopNavBar from '../../components/layout/TopNavbar';

const UserProfileManagement = (props) => {

  return (
    <div>
        <TopNavBar />
        <div className='account-management-container'>
            <div className='title bg-[#123826] '>Account Management</div>
        </div>
    </div>
  );
};

export default UserProfileManagement;
