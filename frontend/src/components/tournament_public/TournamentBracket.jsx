import { useState, useEffect } from 'react'
import {
    SingleEliminationBracket,
    DoubleEliminationBracket,
    Match,
    SVGViewer,
    createTheme,
} from 'react-tournament-brackets'

const useWindowSize = () => {
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
    useEffect(() => {
        const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])
    return size
}

const GreenTheme = createTheme({
    textColor: { main: '#123836', highlighted: '#ffffff', dark: '#123836' },
    matchBackground: { wonColor: '#e8f5e9', lostColor: '#ffffff' },
    score: {
        background: { wonColor: '#123836', lostColor: '#e0e0e0' },
        text: { highlightedWonColor: '#ffffff', highlightedLostColor: '#888' },
    },
    border: { color: '#e0e0e0', highlightedColor: '#123836' },
    roundHeader: { backgroundColor: '#123836', fontColor: '#ffffff' },
    connectorColor: '#d1d5db',
    connectorColorHighlight: '#123836',
    svgBackground: '#ffffff',
})

export const SINGLE_ELIM_DATA = [
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

export const DOUBLE_ELIM_DATA = {
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
            id: 'W6', name: 'WB Semi 2', nextMatchId: 'W7', nextLooserMatchId: 'L3',
            tournamentRoundText: 'WB Semi-Final', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 'hle', name: 'HLE', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'bro', name: 'BRO', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'W7', name: 'WB Final', nextMatchId: 'GF', nextLooserMatchId: 'L4',
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
            id: 'L1', name: 'LB Round 1', nextMatchId: 'L3', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 1', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 't1', name: 'T1', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'bfx', name: 'BFX', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'L2', name: 'LB Round 1B', nextMatchId: 'L3', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 1', startTime: '2024-01-02', state: 'DONE',
            participants: [
                { id: 'kt', name: 'KT', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 'ns', name: 'NS', isWinner: false, resultText: '1', status: 'PLAYED' },
            ],
        },
        {
            id: 'L3', name: 'LB Round 2', nextMatchId: 'L4', nextLooserMatchId: null,
            tournamentRoundText: 'LB Round 2', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'dk', name: 'DK', isWinner: true, resultText: '2', status: 'PLAYED' },
                { id: 't1', name: 'T1', isWinner: false, resultText: '0', status: 'PLAYED' },
            ],
        },
        {
            id: 'L4', name: 'LB Final', nextMatchId: 'GF', nextLooserMatchId: null,
            tournamentRoundText: 'LB Final', startTime: '2024-01-03', state: 'DONE',
            participants: [
                { id: 'hle', name: 'HLE', isWinner: false, resultText: '1', status: 'PLAYED' },
                { id: 'dk', name: 'DK', isWinner: true, resultText: '2', status: 'PLAYED' },
            ],
        },
    ],
}

const TournamentBracket = ({
    mode: initialMode = 'single',
    matches = SINGLE_ELIM_DATA,
    doubleMatches = DOUBLE_ELIM_DATA,
    onMatchClick,
    showTabs = true,
}) => {
    const [mode, setMode] = useState(initialMode)
    const { width } = useWindowSize()

    const svgWidth = Math.max(width * 0.8 - 80, 600)
    const svgHeight = Math.max(svgWidth * 0.55, 400)

    const svgWrapper = ({ children, ...props }) => (
        <SVGViewer
            width={svgWidth}
            height={svgHeight}
            background="#ffffff"
            SVGBackground="#ffffff"
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
                            className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all
                ${mode === key
                                    ? 'bg-[#123836] text-white border-[#123836]'
                                    : 'bg-white text-[#123836] border-gray-300 hover:bg-[#123836]/10'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {mode === 'single' && (
                <SingleEliminationBracket
                    matches={matches}
                    matchComponent={Match}
                    theme={GreenTheme}
                    options={bracketOptions}
                    svgWrapper={svgWrapper}
                    onMatchClick={({ match }) => onMatchClick?.(match)}
                />
            )}

            {mode === 'double' && (
                <DoubleEliminationBracket
                    matches={doubleMatches}
                    matchComponent={Match}
                    theme={GreenTheme}
                    options={bracketOptions}
                    svgWrapper={svgWrapper}
                    onMatchClick={({ match }) => onMatchClick?.(match)}
                />
            )}
        </div>
    )
}

export default TournamentBracket
