import LeaderboardTable from './LeaderboardTable';

const LeaderboardGrid = ({ groups, advanceCount, standingsMode, emptyMessage = 'No group stages generated yet.' }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col py-[5%] items-center justify-center text-gray-500">
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
      {groups.map((group) => (
        <LeaderboardTable
          key={group.id}
          group={group}
          advanceCount={advanceCount}
          standingsMode={standingsMode}
        />
      ))}
    </div>
  );
};

export default LeaderboardGrid;
