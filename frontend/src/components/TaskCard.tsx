import React from 'react';

interface TaskCardProps {
	title?: string;
	description?: string;
	status?: string;
}

const TaskCard: React.FC<TaskCardProps> = () => {
	return <div className="hidden" />;
};

export default TaskCard;


