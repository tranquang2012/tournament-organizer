//LoadingBar
function TopLoadingBar({ isLoading }) {
    if (!isLoading) return null

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-50 bg-gray-200">
            <div className="h-full bg-[#123836] animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
    )
}

export default TopLoadingBar;