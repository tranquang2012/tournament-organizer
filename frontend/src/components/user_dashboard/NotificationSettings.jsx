import notification from '../../assets/notification.png'

const NotificationSetting = () => {
    return (
        <div>
            <div className='notification flex flex-col items-center justify-center h-[300px]'>
                <img
                    src={notification}
                    alt="no-notification"
                    className='w-[100px] h-[80px]'
                />
                <span className='text-[16px]'>No notification yet!</span>
            </div>
        </div>
    );
};

export default NotificationSetting;
