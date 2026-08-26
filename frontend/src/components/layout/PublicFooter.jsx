import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTwitter, faGooglePlusG } from '@fortawesome/free-brands-svg-icons';
import { faLocationDot, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';

const PublicFooter = () => {
    return (
        <footer className='bg-[#123836] text-white px-[5%] md:px-[10%] py-10'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12'>
                <div className='flex flex-col gap-3'>
                    <span className='font-bold text-[20px] tracking-widest uppercase'>Footer Content</span>
                    <p className='text-[15px] text-gray-300'>
                        This is a web application developed by DTech Team for Netcompany
                    </p>
                </div>
                <div className='flex flex-col gap-3'>
                    <span className='font-bold text-[20px] tracking-widest uppercase'>About</span>
                    <div className='flex flex-col gap-3'>
                        {['Projects', 'About Us', 'Blogs', 'Awards'].map((item) => (
                            <a key={item} href='#' className='text-[15px] text-gray-300 hover:text-white w-fit'>
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
                <div className='flex flex-col gap-3'>
                    <span className='font-bold text-[20px] tracking-widest uppercase'>Address</span>
                    <div className='flex flex-col gap-3'>
                        <div className='flex items-start gap-2 text-[15px] text-gray-300'>
                            <FontAwesomeIcon icon={faLocationDot} className='mt-[2px] shrink-0' />
                            <span>24th Floor, Opal Tower, Ho Chi Minh City</span>
                        </div>
                        <div className='flex items-center gap-2 text-[15px] text-gray-300'>
                            <FontAwesomeIcon icon={faEnvelope} className='shrink-0' />
                            <span>dtech@gmail.com</span>
                        </div>
                        <div className='flex items-center gap-2 text-[15px] text-gray-300'>
                            <FontAwesomeIcon icon={faPhone} className='shrink-0' />
                            <span>(+84)28 7300 5750</span>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                    <span className='font-bold text-[14px] tracking-widest uppercase'>Follow Us</span>
                    <div className='flex flex-col gap-3'>
                        <a href='https://www.facebook.com' target="_blank" rel="noopener noreferrer" className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:opacity-80'>
                            <FontAwesomeIcon icon={faFacebookF} className='text-[15px]' />
                        </a>
                        <a href='https://x.com/?lang=vi' target="_blank" rel="noopener noreferrer" className='w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center hover:opacity-80'>
                            <FontAwesomeIcon icon={faTwitter} className='text-[15px]' />
                        </a>
                        <a href='https://myaccount.google.com' target="_blank" rel="noopener noreferrer" className='w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:opacity-80'>
                            <FontAwesomeIcon icon={faGooglePlusG} className='text-[15px]' />
                        </a>
                    </div>
                </div>
            </div>
            <div className='mt-10 border-t border-white/10 pt-4 text-center text-[13px] text-gray-400'>
                © {new Date().getFullYear()} DTech Team and Netcompany. All rights reserved.
            </div>
        </footer>
    );
};

export default PublicFooter;