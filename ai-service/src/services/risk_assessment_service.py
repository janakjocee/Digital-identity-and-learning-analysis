"""
Risk Assessment Service
Identifies students at risk of dropping out or poor performance
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

import numpy as np

logger = logging.getLogger(__name__)

class RiskAssessmentService:
    """Service for assessing dropout risk"""
    
    RISK_LEVELS = {
        'low': {'min': 0, 'max': 0.3, 'label': 'Low Risk'},
        'medium': {'min': 0.3, 'max': 0.6, 'label': 'Medium Risk'},
        'high': {'min': 0.6, 'max': 0.8, 'label': 'High Risk'},
        'critical': {'min': 0.8, 'max': 1.0, 'label': 'Critical Risk'}
    }
    
    def __init__(self):
        self.risk_weights = {
            'activity_frequency': 0.25,
            'quiz_performance': 0.25,
            'completion_rate': 0.20,
            'streak_days': 0.15,
            'time_since_last': 0.15
        }
    
    def assess_risk(
        self,
        activity_summary: Dict[str, Any],
        quiz_summary: Dict[str, Any],
        last_active: Optional[datetime] = None,
        streak_days: int = 0
    ) -> Dict[str, Any]:
        """Assess dropout risk based on activity and performance"""
        
        risk_factors = []
        risk_scores = []
        
        # Activity frequency risk
        unique_days = activity_summary.get('uniqueDays', [])
        total_activities = activity_summary.get('totalActivities', 0)
        
        if len(unique_days) < 3:
            risk_scores.append(('activity_frequency', 0.8))
            risk_factors.append('Very low activity in the last 30 days')
        elif len(unique_days) < 7:
            risk_scores.append(('activity_frequency', 0.5))
            risk_factors.append('Low activity frequency')
        else:
            risk_scores.append(('activity_frequency', 0.2))
        
        # Quiz performance risk
        avg_score = quiz_summary.get('averageScore', 0)
        if avg_score < 40:
            risk_scores.append(('quiz_performance', 0.9))
            risk_factors.append('Very poor quiz performance')
        elif avg_score < 60:
            risk_scores.append(('quiz_performance', 0.6))
            risk_factors.append('Below average quiz performance')
        elif avg_score < 70:
            risk_scores.append(('quiz_performance', 0.3))
        else:
            risk_scores.append(('quiz_performance', 0.1))
        
        # Completion rate risk
        completion_rate = quiz_summary.get('completedAttempts', 0) / max(1, quiz_summary.get('totalAttempts', 1))
        if completion_rate < 0.5:
            risk_scores.append(('completion_rate', 0.7))
            risk_factors.append('Low quiz completion rate')
        elif completion_rate < 0.8:
            risk_scores.append(('completion_rate', 0.4))
        else:
            risk_scores.append(('completion_rate', 0.1))
        
        # Streak days risk
        if streak_days < 2:
            risk_scores.append(('streak_days', 0.6))
            risk_factors.append('No consistent learning streak')
        elif streak_days < 7:
            risk_scores.append(('streak_days', 0.3))
        else:
            risk_scores.append(('streak_days', 0.1))
        
        # Time since last activity
        if last_active:
            days_since = (datetime.now() - last_active).days
            if days_since > 14:
                risk_scores.append(('time_since_last', 0.8))
                risk_factors.append('No activity in the last 2 weeks')
            elif days_since > 7:
                risk_scores.append(('time_since_last', 0.5))
                risk_factors.append('No activity in the last week')
            else:
                risk_scores.append(('time_since_last', 0.1))
        else:
            risk_scores.append(('time_since_last', 0.7))
            risk_factors.append('No recorded activity')
        
        # Calculate weighted risk score
        total_weight = sum(self.risk_weights.get(factor, 0.1) for factor, _ in risk_scores)
        weighted_score = sum(
            self.risk_weights.get(factor, 0.1) * score
            for factor, score in risk_scores
        ) / total_weight
        
        # Determine risk level
        risk_level = self._get_risk_level(weighted_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, risk_factors)
        
        return {
            "risk_level": risk_level,
            "risk_score": round(weighted_score, 2),
            "factors": risk_factors,
            "recommendations": recommendations
        }
    
    def assess_risk_from_activity(
        self,
        activity_data: List[Dict[str, Any]],
        quiz_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Assess risk from raw activity data"""
        
        # Calculate activity summary
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_activity = [
            a for a in activity_data
            if datetime.fromisoformat(str(a['timestamp']).replace('Z', '+00:00')) >= thirty_days_ago
        ]
        
        unique_days = set()
        for activity in recent_activity:
            dt = datetime.fromisoformat(str(activity['timestamp']).replace('Z', '+00:00'))
            unique_days.add(dt.date())
        
        activity_summary = {
            'uniqueDays': list(unique_days),
            'totalActivities': len(recent_activity),
            'totalDuration': sum(a.get('duration', 0) for a in recent_activity)
        }
        
        # Calculate quiz summary
        recent_quizzes = [
            q for q in quiz_history
            if datetime.fromisoformat(str(q['completedAt']).replace('Z', '+00:00')) >= thirty_days_ago
        ]
        
        if recent_quizzes:
            scores = [q['score'] for q in recent_quizzes]
            quiz_summary = {
                'totalAttempts': len(recent_quizzes),
                'averageScore': np.mean(scores),
                'completedAttempts': len(recent_quizzes)
            }
        else:
            quiz_summary = {
                'totalAttempts': 0,
                'averageScore': 0,
                'completedAttempts': 0
            }
        
        # Get last active date
        last_active = None
        if activity_data:
            last_activity = max(activity_data, key=lambda x: x['timestamp'])
            last_active = datetime.fromisoformat(str(last_activity['timestamp']).replace('Z', '+00:00'))
        elif quiz_history:
            last_quiz = max(quiz_history, key=lambda x: x['completedAt'])
            last_active = datetime.fromisoformat(str(last_quiz['completedAt']).replace('Z', '+00:00'))
        
        return self.assess_risk(activity_summary, quiz_summary, last_active, 0)
    
    def _get_risk_level(self, score: float) -> str:
        """Convert risk score to risk level"""
        for level, config in self.RISK_LEVELS.items():
            if config['min'] <= score < config['max']:
                return level
        return 'low'
    
    def _generate_recommendations(self, risk_level: str, factors: List[str]) -> List[str]:
        """Generate recommendations based on risk level"""
        recommendations = []
        
        if risk_level == 'critical':
            recommendations.extend([
                'Immediate intervention required - schedule one-on-one meeting',
                'Contact student or guardian to understand challenges',
                'Provide additional tutoring and support resources',
                'Consider adjusting learning plan or pace'
            ])
        elif risk_level == 'high':
            recommendations.extend([
                'Schedule check-in with student within 48 hours',
                'Review learning materials for difficulty level',
                'Send encouraging reminders and study tips',
                'Offer additional practice materials'
            ])
        elif risk_level == 'medium':
            recommendations.extend([
                'Send weekly progress summary',
                'Suggest study schedule improvements',
                'Recommend peer study groups',
                'Provide tips for better time management'
            ])
        else:  # low
            recommendations.extend([
                'Continue current learning path',
                'Provide advanced challenges if appropriate',
                'Encourage peer mentoring opportunities'
            ])
        
        return recommendations