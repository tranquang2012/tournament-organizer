import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { faUser, faPencil } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import './UserProfileManagement.css'

//import component
import TopNavBar from '../../components/layout/TopNavbar';

const UserProfileManagement = (props) => {

    const [section, setSection] = useState('myProfile')

    return (
        <div>
            <TopNavBar />
            <div className='account-management'>
                <div className='title flex items-center bg-[#123826] h-[60px] pl-90 text-white text-[30px]'>Account Management</div>
                <div className='account-management-container h-[500px] w-full px-90 py-5'>
                    <div className='content-left w-[30%]'>
                        <div className='profile h-[120px] w-full flex'>
                            <div className='profile-image border border-black rounded-[50%] h-full w-[120px] flex items-center justify-center'>
                                <FontAwesomeIcon icon={faUser} className='user-icon text-[80px]' />
                            </div>
                            <div className='edit-img pl-[30px] flex flex-col justify-center'>
                                <div className='text-[25px]'><b>User1</b></div>
                                <div className='cursor-pointer text-gray-850'><FontAwesomeIcon icon={faPencil}></FontAwesomeIcon> Change your avatar</div>
                            </div>
                        </div>
                        <div className='section'>
                            <FontAwesomeIcon icon={faUser} className='user-icon text-[20px]' /> My Profile
                        </div>
                    </div>
                    <div className='content-right w-[70%]'></div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileManagement;
