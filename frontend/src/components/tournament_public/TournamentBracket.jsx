import { useState, useEffect } from 'react'
import { SingleEliminationBracket, DoubleEliminationBracket } from 'react-tournament-brackets'

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'
import trophy from '../../assets/trophy.png'

const EMPTY_DOUBLE = { upper: [], lower: [] }

// WebKit paints foreignObject content at the root SVG origin as soon as that
// content creates a render layer, which stacks every match at the top-left on
// iOS. Nothing in this card may use position, opacity, transform or transition;
// losing sides are dimmed with colour alpha instead. See webkit.org bug 23113.
const CustomMatch = ({ match, topParty, bottomParty, topWon, bottomWon, onPartyClick, onMouseEnter, onMouseLeave }) => {
    const hasResult = match.state === 'DONE'
    const topLost = hasResult && !topWon
    const bottomLost = hasResult && !bottomWon

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <div className="flex items-center justify-between px-1 pb-0.5">
                <span className="text-[13px] text-[#123836] font-medium ">{match.name}</span>
                <span className="text-[13px] text-gray-400">{match.startTime}</span>
            </div>
            <div className="flex flex-col border border-gray-300 rounded-[5px] shadow-md">
                <div className={`flex items-center cursor-pointer hover:bg-gray-50 border-b border-gray-300
                    ${topLost ? 'bg-gray-50' : ''}`}
                    onClick={() => onPartyClick?.(topParty, topWon)}
                    onMouseEnter={() => onMouseEnter?.(topParty?.id)}
                    onMouseLeave={onMouseLeave}
                >
                    <div className='flex px-2 py-1.5 items-center gap-2'>
                        {topParty?.name !== 'BYE' && (
                            <img src={topParty?.logo || logo1} className='h-7 w-7 flex-shrink-0 object-contain' />
                        )}
                        <span className={`text-[16px] ${topWon ? 'font-semibold text-gray-800' : topLost ? 'font-normal text-gray-400' : 'font-normal text-gray-700'}`}>
                            {topParty?.name || 'TBD'}
                        </span>
                    </div>
                    {topWon && match.nextMatchId === null && (
                        <img src={trophy} alt='trophy' className='h-6 w-6' />
                    )}
                    {topParty?.resultText != null && (
                        <div className={`text-[16px] font-bold px-3 self-stretch flex items-center text-white ml-auto rounded-tr-[5px]
                            ${topLost ? 'bg-[#123836]/40' : 'bg-[#123836]'}`}>
                            {topParty.resultText}
                        </div>
                    )}
                </div>
                <div className={`flex items-center cursor-pointer hover:bg-gray-50
                    ${bottomLost ? 'bg-gray-50' : ''}`}
                    onClick={() => onPartyClick?.(bottomParty, bottomWon)}
                    onMouseEnter={() => onMouseEnter?.(bottomParty?.id)}
                    onMouseLeave={onMouseLeave}
                >
                    <div className='flex px-2 py-1.5 items-center gap-2'>
                        {bottomParty?.name !== 'BYE' && (
                            <img src={bottomParty?.logo || logo2} className='h-7 w-7 flex-shrink-0 object-contain' />
                        )}
                        <span className={`text-[16px] ${bottomWon ? 'font-semibold text-gray-800' : bottomLost ? 'font-normal text-gray-400' : 'font-normal text-gray-700'}`}>
                            {bottomParty?.name || 'TBD'}
                        </span>
                    </div>
                    {bottomWon && match.nextMatchId === null && (
                        <img src={trophy} alt='trophy' className='h-6 w-6' />
                    )}
                    {bottomParty?.resultText != null && (
                        <div className={`text-[16px] font-bold px-3 self-stretch flex items-center text-white ml-auto rounded-br-[5px]
                            ${bottomLost ? 'bg-[#123836]/40' : 'bg-[#123836]'}`}>
                            {bottomParty.resultText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const TournamentBracket = ({
    mode: initialMode = 'single',
    matches = [],
    doubleMatches = EMPTY_DOUBLE,
    onMatchClick,
    showTabs = true
}) => {
    const [mode, setMode] = useState(initialMode)
    useEffect(() => {
        setMode(initialMode)
    }, [initialMode])
    const doubleData = doubleMatches || EMPTY_DOUBLE

    const singleMatchCount = matches.length
    const doubleMatchCount = Math.max(
        doubleData.upper?.length || 0,
        doubleData.lower?.length || 0
    )
    const hasBracket = mode === 'double' ? doubleMatchCount > 0 : singleMatchCount > 0

    // SVGViewer pans and zooms via a transform on a <g>, which WebKit ignores when
    // positioning foreignObject content. Native scrolling keeps the bracket usable
    // on iOS and still lets wide brackets be dragged into view everywhere else.
    const svgWrapper = ({ children }) => (
        <div className="w-full overflow-x-auto bg-white">
            {children}
        </div>
    )

    const bracketOptions = {
        style: {
            roundHeader: { backgroundColor: '#123836', fontColor: '#ffffff' },
            connectorColor: '#d1d5db',
            connectorColorHighlight: '#123836',
        },
    }

    return (
        <div className="overflow-x-auto">
            {showTabs && (
                <div className="flex flex-wrap gap-2 mb-5">
                    {[
                        { key: 'single', label: 'Single Elimination' },
                        { key: 'double', label: 'Double Elimination' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setMode(key)}
                            className={`px-3 md:px-4 py-1.5 rounded-[15px] text-sm md:text-[18px] font-medium border transition-all
                                    ${mode === key
                                    ? 'bg-[#123836] text-white border-[#123836]'
                                    : 'bg-white text-[#123836] border-gray-300 hover:bg-[#123836]/10 cursor-pointer'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
            {!hasBracket ? (
                <div className="flex justify-center py-10 text-gray-500">
                    No bracket matches generated yet.
                </div>
            ) : mode === 'single' ? (
                <SingleEliminationBracket
                    matches={matches}
                    matchComponent={CustomMatch}
                    options={bracketOptions}
                    svgWrapper={svgWrapper}
                    onMatchClick={({ match }) => onMatchClick?.(match)}
                />
            ) : (
                <DoubleEliminationBracket
                    matches={doubleData}
                    matchComponent={CustomMatch}
                    options={bracketOptions}
                    svgWrapper={svgWrapper}
                    onMatchClick={({ match }) => onMatchClick?.(match)}
                />
            )}
        </div>
    )
}

export default TournamentBracket
