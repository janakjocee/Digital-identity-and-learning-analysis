"""
Recommendation Service
Generates personalized learning recommendations
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

import numpy as np

logger = logging.getLogger(__name__)

class RecommendationService:
    """Service for generating personalized recommendations"""
    
    RECOMMENDATION_TYPES = {
        'module': 'Recommended Module',
        'quiz': 'Practice Quiz',
        'revision': 'Revision Material',
        'practice': 'Additional Practice'
    }
    
    def __init__(self):
        self.priority_weights = {
            'weak_topic': 10,
            'skill_gap': 8,
            'next_in_sequence': 6,
            'review_needed': 7,
            'interest_based': 4,
            'challenge': 5
        }
    
    def generate_recommendations(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized recommendations for a student"""
        
        recommendations = []
        weak_topics = []
        
        quiz_history = student_data.get('recentAttempts', [])
        performance_metrics = student_data.get('performanceMetrics', {})
        learning_profile = student_data.get('learningProfile', {})
        
        # Analyze weak topics
        weak_topics = self._identify_weak_topics(quiz_history)
        
        # Generate recommendations based on weak topics
        for topic in weak_topics[:3]:
            recommendations.append({
                'type': 'revision',
                'title': f'Review: {topic.get("subject", "Topic")}',
                'description': f'Focus on improving your understanding of this topic (current score: {topic.get("averageScore", 0):.0f}%)',
                'priority': self.priority_weights['weak_topic'],
                'reason': 'weak_performance',
                'estimatedTime': '30-45 minutes'
            })
        
        # Recommend next module based on progress
        next_module = self._recommend_next_module(student_data)
        if next_module:
            recommendations.append({
                'type': 'module',
                'title': next_module['title'],
                'description': 'Continue your learning journey with this recommended module',
                'priority': self.priority_weights['next_in_sequence'],
                'reason': 'learning_progression',
                'estimatedTime': f'{next_module.get("duration", 30)} minutes'
            })
        
        # Recommend practice quiz
        practice_quiz = self._recommend_practice_quiz(student_data)
        if practice_quiz:
            recommendations.append({
                'type': 'quiz',
                'title': practice_quiz['title'],
                'description': 'Test your knowledge with this practice quiz',
                'priority': self.priority_weights['skill_gap'],
                'reason': 'skill_assessment',
                'estimatedTime': f'{practice_quiz.get("duration", 20)} minutes'
            })
        
        # Recommend based on learning style
        style_recommendation = self._recommend_by_learning_style(learning_profile)
        if style_recommendation:
            recommendations.append({
                'type': 'practice',
                'title': style_recommendation['title'],
                'description': style_recommendation['description'],
                'priority': self.priority_weights['interest_based'],
                'reason': 'learning_style_match',
                'estimatedTime': '20-30 minutes'
            })
        
        # Sort by priority
        recommendations.sort(key=lambda x: x['priority'], reverse=True)
        
        # Generate study plan
        study_plan = self._generate_study_plan(recommendations, student_data)
        
        return {
            'recommendations': recommendations[:5],  # Top 5 recommendations
            'weakTopics': weak_topics,
            'studyPlan': study_plan
        }
    
    def _identify_weak_topics(self, quiz_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify topics where student is struggling"""
        weak_topics = []
        
        # Group by subject
        subject_scores = {}
        for attempt in quiz_history:
            subject = attempt.get('subject', 'Unknown')
            if subject not in subject_scores:
                subject_scores[subject] = []
            subject_scores[subject].append(attempt.get('score', 0))
        
        # Find subjects with low scores
        for subject, scores in subject_scores.items():
            avg_score = np.mean(scores)
            if avg_score < 70:
                weak_topics.append({
                    'subject': subject,
                    'averageScore': round(avg_score, 1),
                    'attempts': len(scores),
                    'priority': 'high' if avg_score < 50 else 'medium'
                })
        
        # Sort by priority and score
        weak_topics.sort(key=lambda x: (0 if x['priority'] == 'high' else 1, x['averageScore']))
        
        return weak_topics
    
    def _recommend_next_module(self, student_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Recommend the next module based on progress"""
        assigned_class = student_data.get('assignedClass', 8)
        
        # This would typically query the database
        # For now, return a placeholder
        return {
            'title': f'Advanced Concepts - Class {assigned_class}',
            'duration': 30,
            'difficulty': 'medium'
        }
    
    def _recommend_practice_quiz(self, student_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Recommend a practice quiz"""
        weak_topics = self._identify_weak_topics(student_data.get('recentAttempts', []))
        
        if weak_topics:
            topic = weak_topics[0]
            return {
                'title': f'Practice Quiz: {topic["subject"]}',
                'duration': 20,
                'difficulty': 'adaptive'
            }
        
        return {
            'title': 'General Knowledge Check',
            'duration': 15,
            'difficulty': 'medium'
        }
    
    def _recommend_by_learning_style(self, learning_profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generate recommendation based on learning style"""
        style = learning_profile.get('style', 'mixed')
        
        recommendations = {
            'visual': {
                'title': 'Interactive Visual Learning',
                'description': 'Explore concepts through videos, diagrams, and interactive visualizations'
            },
            'auditory': {
                'title': 'Audio Lessons & Discussions',
                'description': 'Listen to recorded lessons and participate in discussion forums'
            },
            'kinesthetic': {
                'title': 'Hands-on Practice',
                'description': 'Learn by doing with interactive exercises and simulations'
            },
            'reading': {
                'title': 'In-depth Reading Materials',
                'description': 'Study comprehensive notes and reference materials'
            },
            'mixed': {
                'title': 'Multi-Modal Learning',
                'description': 'Experience a variety of learning formats for better retention'
            }
        }
        
        return recommendations.get(style, recommendations['mixed'])
    
    def _generate_study_plan(
        self,
        recommendations: List[Dict[str, Any]],
        student_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a personalized study plan"""
        
        learning_profile = student_data.get('learningProfile', {})
        pace = learning_profile.get('pace', 'adaptive')
        
        # Determine daily study time based on pace
        if pace == 'slow':
            daily_time = 30
        elif pace == 'fast':
            daily_time = 90
        else:
            daily_time = 60
        
        # Create weekly schedule
        weekly_schedule = []
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for i, day in enumerate(days):
            if i < 5:  # Weekdays
                day_activities = []
                remaining_time = daily_time
                
                # Add high priority items first
                for rec in recommendations:
                    if remaining_time <= 0:
                        break
                    
                    # Estimate time from recommendation
                    time_str = rec.get('estimatedTime', '30 minutes')
                    estimated_mins = 30
                    if 'minutes' in time_str:
                        try:
                            estimated_mins = int(time_str.split('-')[0].split()[0])
                        except:
                            pass
                    
                    if estimated_mins <= remaining_time:
                        day_activities.append({
                            'activity': rec['title'],
                            'type': rec['type'],
                            'duration': estimated_mins
                        })
                        remaining_time -= estimated_mins
                
                weekly_schedule.append({
                    'day': day,
                    'activities': day_activities,
                    'totalTime': daily_time - remaining_time
                })
            else:  # Weekend
                weekly_schedule.append({
                    'day': day,
                    'activities': [{'activity': 'Review and practice', 'type': 'review', 'duration': 30}],
                    'totalTime': 30
                })
        
        return {
            'dailyStudyTime': daily_time,
            'weeklySchedule': weekly_schedule,
            'goals': [
                'Complete recommended modules',
                'Improve scores in weak topics',
                'Maintain consistent study streak'
            ],
            'tips': self._generate_study_tips(learning_profile)
        }
    
    def _generate_study_tips(self, learning_profile: Dict[str, Any]) -> List[str]:
        """Generate study tips based on learning profile"""
        style = learning_profile.get('style', 'mixed')
        
        tips = {
            'visual': [
                'Use color-coded notes and mind maps',
                'Watch video tutorials before reading',
                'Create diagrams to visualize concepts'
            ],
            'auditory': [
                'Record yourself explaining concepts',
                'Join study groups for discussions',
                'Listen to educational podcasts'
            ],
            'kinesthetic': [
                'Take frequent breaks to move around',
                'Use hands-on learning tools',
                'Teach concepts to others'
            ],
            'reading': [
                'Take detailed notes while reading',
                'Summarize each section in your own words',
                'Create flashcards for key terms'
            ],
            'mixed': [
                'Combine multiple learning methods',
                'Experiment to find what works best',
                'Rotate between different study techniques'
            ]
        }
        
        return tips.get(style, tips['mixed'])