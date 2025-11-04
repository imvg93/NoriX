import React from 'react';

interface StatsCardProps {
	title?: string;
	value?: string | number;
	icon?: React.ReactNode;
	trendText?: string;
}

const StatsCard: React.FC<StatsCardProps> = () => {
	return <div className="hidden" />;
};

export default StatsCard;


