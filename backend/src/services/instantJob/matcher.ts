import mongoose from 'mongoose';
import { User } from '../../models/User';
import { IInstantJob } from '../../models/InstantJob';

// Haversine formula to calculate distance between two coordinates (in km)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export interface MatchedStudent {
  _id: any;
  name: string;
  email: string;
  phone: string;
  distance: number;
  rating: number;
  completedJobs: number;
  profilePicture?: string;
  skills: string[];
}

/**
 * Find eligible students for instant job matching
 * Returns students sorted by distance, then rating
 */
export async function findEligibleStudents(
  job: IInstantJob,
  excludeStudentIds: string[] = [],
  limit: number = 5
): Promise<MatchedStudent[]> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // Online = seen in last 5 mins

  // Build query for eligible students
  const query: any = {
    userType: 'student',
    availableForInstantJobs: true,
    // More lenient online check - seen in last 30 minutes (was 5 minutes)
    $or: [
      { onlineStatus: 'online' },
      { lastSeen: { $gte: new Date(now.getTime() - 30 * 60 * 1000) } }
    ],
    // Availability not expired AND not in cooldown
    $and: [
      {
        $or: [
          { instantAvailabilityExpiresAt: { $exists: false } },
          { instantAvailabilityExpiresAt: { $gt: now } }
        ]
      },
      {
        $or: [
          { instantCooldownUntil: { $exists: false } },
          { instantCooldownUntil: { $lt: now } }
        ]
      }
    ],
    // Has location coordinates
    'locationCoordinates.latitude': { $exists: true },
    'locationCoordinates.longitude': { $exists: true },
    // Exclude already notified students
    _id: { $nin: excludeStudentIds.map(id => new mongoose.Types.ObjectId(id)) }
  };

  console.log(`\n🔍 FINDING ELIGIBLE STUDENTS FOR JOB ${job._id}`);
  console.log(`   Query: availableForInstantJobs=true, has location, within 30min online`);
  console.log(`   Excluding ${excludeStudentIds.length} already notified students: ${excludeStudentIds.join(', ')}`);

  const eligibleStudents = await User.find(query)
    .select('name email phone skills locationCoordinates rating completedJobs profilePicture availableForInstantJobs onlineStatus lastSeen instantCooldownUntil')
    .limit(50); // Get more candidates for filtering

  console.log(`   ✅ Found ${eligibleStudents.length} potentially eligible students in database`);
  
  if (eligibleStudents.length > 0) {
    console.log(`   📋 Student Details:`);
    eligibleStudents.forEach((student, idx) => {
      console.log(`      ${idx + 1}. ${student.name} (${student._id})`);
      console.log(`         - Available: ${student.availableForInstantJobs}`);
      console.log(`         - Online Status: ${student.onlineStatus}`);
      console.log(`         - Last Seen: ${student.lastSeen}`);
      console.log(`         - Location: ${student.locationCoordinates?.latitude}, ${student.locationCoordinates?.longitude}`);
      console.log(`         - Cooldown Until: ${student.instantCooldownUntil || 'None'}`);
    });
  } else {
    console.log(`   ⚠️ NO STUDENTS FOUND - Check if any students have:`);
    console.log(`      - availableForInstantJobs = true`);
    console.log(`      - locationCoordinates set`);
    console.log(`      - lastSeen within 30 minutes OR onlineStatus = 'online'`);
    console.log(`      - Not in cooldown`);
  }

  // Filter by skills match and distance
  const matchedStudents: MatchedStudent[] = [];
  
  for (const student of eligibleStudents) {
    // Check skills match
    const studentSkills = (student.skills || []).map((s: string) => s.toLowerCase());
    const requiredSkills = (job.skillsRequired || []).map((s: string) => s.toLowerCase());
    
    const hasMatchingSkills = requiredSkills.length === 0 || 
      requiredSkills.some(skill => studentSkills.some(ss => ss.includes(skill) || skill.includes(ss)));

    if (!hasMatchingSkills) continue;

    // Calculate distance
    const studentLat = student.locationCoordinates?.latitude;
    const studentLon = student.locationCoordinates?.longitude;
    
    if (!studentLat || !studentLon) continue;

    const distance = calculateDistance(
      job.location.latitude,
      job.location.longitude,
      studentLat,
      studentLon
    );

    if (distance > job.radius) continue;

    matchedStudents.push({
      _id: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      rating: student.rating || 0,
      completedJobs: student.completedJobs || 0,
      profilePicture: student.profilePicture,
      skills: student.skills || []
    });
  }
  
  // Sort by distance first, then rating
  matchedStudents.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return (b.rating || 0) - (a.rating || 0);
  });
  
  // Limit to top N matches
  const finalMatches = matchedStudents.slice(0, limit);
  console.log(`   ✅ Returning ${finalMatches.length} matched students`);
  return finalMatches;
}

