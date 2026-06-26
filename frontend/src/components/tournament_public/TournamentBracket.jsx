import { useState, useEffect } from 'react'
import { SingleEliminationBracket, DoubleEliminationBracket, SVGViewer, createTheme } from 'react-tournament-brackets'

import logo1 from '../../assets/defaultTeamLogos/logo1.jpg'
import logo2 from '../../assets/defaultTeamLogos/logo2.jpg'

const SINGLE_ELIM_DATA = [
    {
        id: 260004, name: 'Match 10', nextMatchId: 260006,
        tournamentRoundText: 'Quarter-Final', startTime: '2024-01-01', state: 'DONE',
        participants: [
            { id: 'gen', name: 'GEN', isWinner: true, resultText: '3', status: 'PLAYED' },
            { id: 't1', name: 'T1', isWinner: false, resultText: '0', status: 'PLAYED' },
        ],
    },
    {
        id: 260003, name: 'Match 11', nextMatchId: 260006,
        tournamentRoundText: 'Quarter-Final', startTime: '2024-01-01', state: 'DONE',
        participants: [
            { id: 'dk', name: 'DK', isWinner: true, resultText: '3', status: 'PLAYED' },
            { id: 'bfx', name: 'BFX', isWinner: false, resultText: '1', status: 'PLAYED' },
        ],
    },
    {
        id: 260002, name: 'Match 12', nextMatchId: 260005,
        tournamentRoundText: 'Quarter-Final', startTime: '2024-01-01', state: 'DONE',
        participants: [
            { id: 'kt', name: 'KT', isWinner: false, resultText: '1', status: 'PLAYED' },
            { id: 'hle', name: 'HLE', isWinner: true, resultText: '3', status: 'PLAYED' },
        ],
    },
    {
        id: 260001, name: 'Match 13', nextMatchId: 260005,
        tournamentRoundText: 'Quarter-Final', startTime: '2024-01-01', state: 'DONE',
        participants: [
            { id: 'ns', name: 'NS', isWinner: false, resultText: '0', status: 'PLAYED' },
            { id: 'bro', name: 'BRO', isWinner: true, resultText: '3', status: 'PLAYED' },
        ],
    },
    {
        id: 260006, name: 'Match 14', nextMatchId: 260007,
        tournamentRoundText: 'Semi-Final', startTime: '2024-01-02', state: 'DONE',
        participants: [
            { id: 'gen', name: 'GEN', isWinner: true, resultText: '3', status: 'PLAYED' },
            { id: 'dk', name: 'DK', isWinner: false, resultText: '2', status: 'PLAYED' },
        ],
    },
    {
        id: 260005, name: 'Match 15', nextMatchId: 260007,
        tournamentRoundText: 'Semi-Final', startTime: '2024-01-02', state: 'DONE',
        participants: [
            { id: 'hle', name: 'HLE', isWinner: true, resultText: '3', status: 'PLAYED' },
            { id: 'bro', name: 'BRO', isWinner: false, resultText: '1', status: 'PLAYED' },
        ],
    },
    {
        id: 260007, name: 'Match 16', nextMatchId: null,
        tournamentRoundText: 'Grand Final', startTime: '2024-01-03', state: 'DONE',
        participants: [
            { id: 'gen', name: 'GEN', isWinner: true, resultText: '3', status: 'PLAYED' },
            { id: 'hle', name: 'HLE', isWinner: false, resultText: '1', status: 'PLAYED' },
        ],
    },
]

const DOUBLE_ELIM_DATA = {
    upper: [
        {
            id: 'W1', name: 'WB Match 1', nextMatchId: 'W5', nextLooserMatchId: 'L1',
            tournamentRoundText: 'WB Round 1', startTime: '2024-01-01', state: 'DONE',
            participants: [
                { id: 'gen', name: 'GEN', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 't1', name: 'T1', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'W2', name: 'WB Match 2', nextMatchId: 'W5', nextLooserMatchId: 'L1',
            tournamentRoundText: 'WB Round 1', startTime: '2024-01-01', state: 'DONE',
            participants: [
                { id: 'dk', name: 'DK', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'bfx', name: 'BFX', isWinner: false, resultText: '1', status: 'PLAYED' },
            ],
        },
        {
            id: 'W3', name: 'WB Match 3', nextMatchId: 'W6', nextLooserMatchId: 'L2',
            tournamentRoundText: 'WB Round 1', startTime: '2024-01-01', state: 'DONE',
            participants: [
                { id: 'kt', name: 'KT', isWinner: false, resultText: '1', status: 'PLAYED' },
                { id: 'hle', name: 'HLE', isWinner: true, resultText: '2', status: 'PLAYED' },
            ],
        },
        {
            id: 'W4', name: 'WB Match 4', nextMatchId: 'W6', nextLooserMatchId: 'L2',
            tournamentRoundText: 'WB Round 1', startTime: '2024-01-01', state: 'DONE',
            participants: [
                { id: 'ns', name: 'NS', isWinner: false, resultText: '0', status: 'PLAYED' },
                { id: 'bro', name: 'BRO', isWinner: true, resultText: '2', status: 'PLAYED' },
            ],
        },
        {
            id: 'W5', name: 'WB Semi 1', nextMatchId: 'W7', nextLooserMatchId: 'L3',
            tournamentRoundText: 'WB Semi-Final', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 'gen', name: 'GEN', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'dk', name: 'DK', isWinner: false, resultText: '1', status: 'PLAYED' },
            ],
        },
        {
            id: 'W6', name: 'WB Semi 2', nextMatchId: 'W7', nextLooserMatchId: 'L4',
            tournamentRoundText: 'WB Semi-Final', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 'hle', name: 'HLE', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'bro', name: 'BRO', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'W7', name: 'WB Final', nextMatchId: 'GF', nextLooserMatchId: 'L6',
            tournamentRoundText: 'WB Final', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'gen', name: 'GEN', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'hle', name: 'HLE', isWinner: false, resultText: '1', status: 'PLAYED' },
            ],
        },
        {
            id: 'GF', name: 'Grand Final', nextMatchId: null, nextLooserMatchId: null,
            tournamentRoundText: 'Grand Final', startTime: '2024-01-04', state: 'DONE',
            participants: [
                { id: 'gen', name: 'GEN', isWinner: true, resultText: '3', status: 'PLAYED' },
                { id: 'dk', name: 'DK', isWinner: false, resultText: '1', status: 'PLAYED' },
            ],
        },
    ],
    lower: [
        {
            id: 'L1', name: 'LB Match 1', nextMatchId: 'L3', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 1', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 't1', name: 'T1', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'bfx', name: 'BFX', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'L2', name: 'LB Match 2', nextMatchId: 'L4', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 1', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 'kt', name: 'KT', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'ns', name: 'NS', isWinner: false, resultText: '1', status: 'PLAYED' },
            ],
        },
        {
            id: 'L3', name: 'LB Match 3', nextMatchId: 'L5', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 2', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'dk', name: 'DK', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 't1', name: 'T1', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'L4', name: 'LB Match 4', nextMatchId: 'L5', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 2', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'kt', name: 'KT', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'bro', name: 'BRO', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'L5', name: 'LB Match 5', nextMatchId: 'L6', nextLooserMatchId: null,
            tournamentRoundText: 'LB Final', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'kt', name: 'KT', isWinner: false, resultText: '1', status: 'PLAYED' },
                { id: 'dk', name: 'DK', isWinner: true, resultText: '2', status: 'PLAYED' },
            ],
        },
        {
            id: 'L6', name: 'LB Final', nextMatchId: 'GF', nextLooserMatchId: null,
            tournamentRoundText: 'LB Final', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'hle', name: 'HLE', isWinner: false, resultText: '1', status: 'PLAYED' },
                { id: 'dk', name: 'DK', isWinner: true, resultText: '2', status: 'PLAYED' },
            ],
        },
    ],
}

//get window size
const useWindowSize = () => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
    useEffect(() => {
        const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])
    return size
}

const CustomMatch = ({ match, topParty, bottomParty, topWon, bottomWon, onPartyClick, onMouseEnter, onMouseLeave }) => {
    const hasResult = match.state === 'DONE'

    return (
        <div className="w-full h-full flex flex-col justify-center relative">
            <div className="absolute -top-1.5 left-0 right-0 flex items-center justify-between px-1">
                <span className="text-[13px] text-[#123836] font-medium ">{match.name}</span>
                <span className="text-[13px] text-gray-400">{match.startTime} | 13:00 PM</span>
            </div>
            <div className="flex flex-col border border-gray-300 rounded-[5px] shadow-md">
                <div className={`flex items-center cursor-pointer hover:bg-gray-50 transition-opacity h-[50%] border-b border-gray-300
                    ${hasResult && !topWon ? 'opacity-40' : 'opacity-100'}`}
                    onClick={() => onPartyClick?.(topParty, topWon)}
                    onMouseEnter={() => onMouseEnter?.(topParty?.id)}
                    onMouseLeave={onMouseLeave}
                >
                    <div className='flex px-2 py-1.5 h-full items-center gap-2'>
                        <img src={logo1} className='h-7 w-7 flex-shrink-0' />
                        <span className={`text-[16px] ${topWon ? 'font-semibold text-gray-800' : 'font-normal text-gray-700'}`}>
                            {topParty?.name || 'TBD'}
                        </span>
                    </div>
                    {topParty?.resultText != null && (
                        <div className='text-[16px] font-bold px-3 self-stretch flex items-center bg-[#123836] text-white ml-auto rounded-tr-[5px]'>
                            {topParty.resultText}
                        </div>
                    )}
                </div>
                <div className={`flex items-center cursor-pointer hover:bg-gray-50 transition-opacity h-[50%]
                    ${hasResult && !bottomWon ? 'opacity-40' : 'opacity-100'}`}
                    onClick={() => onPartyClick?.(bottomParty, bottomWon)}
                    onMouseEnter={() => onMouseEnter?.(bottomParty?.id)}
                    onMouseLeave={onMouseLeave}
                >
                    <div className='flex px-2 h-full items-center gap-2'>
                        <img src={logo2} className='h-7 w-7 flex-shrink-0' />
                        <span className={`text-[16px] ${bottomWon ? 'font-semibold text-gray-800' : 'font-normal text-gray-700'}`}>
                            {bottomParty?.name || 'TBD'}
                        </span>
                    </div>
                    {bottomParty?.resultText != null && (
                        <div className='text-[16px] font-bold px-3 self-stretch flex items-center bg-[#123836] text-white ml-auto rounded-br-[5px]'>
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
    matches = SINGLE_ELIM_DATA,
    doubleMatches = DOUBLE_ELIM_DATA,
    onMatchClick,
    showTabs = true
}) => {
    const [mode, setMode] = useState(initialMode)
    const { width } = useWindowSize()
    const matchHeight = 120

    const singleMatchCount = matches.length
    const doubleMatchCount = Math.max(
        doubleMatches.upper.length,
        doubleMatches.lower.length
    )

    const svgWidth = Math.max(width * 0.8 - 80, 600)
    const svgHeight = mode === 'double' ? Math.max(doubleMatchCount * matchHeight * 2.5, 600) : Math.max(singleMatchCount * matchHeight * 2.5, 400)

    const svgWrapper = ({ children, ...props }) => (
        <SVGViewer
            width={svgWidth}
            height={svgHeight}
            background="#ffffff"
            SVGBackground="#ffffff"
            detectWheel={false}
            detectPinchGesture={false}
            disableDoubleClickZoomWithToolAuto={true}
            miniatureProps={{ position: 'none' }}
            {...props}
        >
            {children}
        </SVGViewer>
    )

    const bracketOptions = {
        style: {
            roundHeader: { backgroundColor: '#123836', fontColor: '#ffffff' },
            connectorColor: '#d1d5db',
            connectorColorHighlight: '#123836',
        },
    }

    return (
        <div>
            {showTabs && (
                <div className="flex gap-2 mb-5">
                    {[
                        { key: 'single', label: 'Single Elimination' },
                        { key: 'double', label: 'Double Elimination' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setMode(key)}
                            className={`px-4 py-1.5 rounded-[15px] text-[18px] font-medium border transition-all
                                    ${mode === key
                                    ? 'bg-[#123836] text-white border-[#123836]'
                                    : 'bg-white text-[#123836] border-gray-300 hover:bg-[#123836]/10 cursor-pointer'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
            {mode === 'single' && (
                <SingleEliminationBracket
                    matches={matches}
                    matchComponent={CustomMatch}
                    options={bracketOptions}
                    svgWrapper={svgWrapper}
                    onMatchClick={({ match }) => onMatchClick?.(match)}
                />
            )}
            {mode === 'double' && (
                <DoubleEliminationBracket
                    matches={doubleMatches}
                    matchComponent={CustomMatch}
                    options={bracketOptions}
                    svgWrapper={svgWrapper}
                    onMatchClick={({ match }) => onMatchClick?.(match)}
                />
            )}
        </div>
    )
}

export default TournamentBracket;
