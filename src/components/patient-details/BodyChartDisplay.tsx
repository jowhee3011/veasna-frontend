export const BodyChartDisplay = ({ painpoints }: { painpoints: any[] }) => {
    if (!painpoints || painpoints.length === 0) {
      return <p className="text-center text-gray-500 py-4">No pain points recorded</p>;
    }
  
    return (
      <div className="max-w-[600px] w-full mx-auto">
        <div className="relative inline-block w-full">
          <img
            src="/bodychart.jpg"
            alt="Body Chart"
            className="block w-full h-auto"
          />
          {painpoints.map((point, index) => (
            <div
              key={index}
              className="absolute w-2.5 h-2.5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white box-border"
              style={{
                left: `${point.x_coord || point.xCoord}%`,
                top: `${point.y_coord || point.yCoord}%`,
              }}
              title={`Pain point ${index + 1}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center mt-2">
          {painpoints.length} pain point{painpoints.length !== 1 ? 's' : ''} marked
        </p>
      </div>
    );
  };