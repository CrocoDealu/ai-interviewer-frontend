import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  Award,
  BookOpen,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

// Mock data for dashboard

const mockRecommendations = [
  {
    title: 'Practice Technical Questions',
    description: 'Focus on coding and system design questions',
    type: 'skill',
  },
  {
    title: 'Improve Confidence',
    description: 'Work on body language and speaking pace',
    type: 'soft-skill',
  },
  {
    title: 'Try Finance Industry',
    description: 'Expand your practice to new industries',
    type: 'exploration',
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch user data
  useEffect(() => {
    if (user) {
      Promise.all([
        apiService.getUserStats(),
        apiService.getUserInterviews()
      ])
        .then(([statsResponse, interviewsResponse]) => {
          setStats(statsResponse.stats);
          setRecentInterviews(interviewsResponse.interviews.slice(0, 3)); // Show last 3
        })
        .catch(error => {
          console.error('Failed to fetch dashboard data:', error);
          // Use fallback data
          setStats({
            totalInterviews: 12,
            averageScore: 78,
            improvementRate: 15,
            timeSpent: 4.5,
          });
          setRecentInterviews([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
          <Button asChild>
            <Link to="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}! 👋</h1>
            <p className="text-muted-foreground">
              Track your interview preparation progress and continue improving
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/onboarding">
              <Plus className="mr-2 h-4 w-4" />
              New Practice Session
            </Link>
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalInterviews || 0}</p>
                <p className="text-sm text-muted-foreground">Total Interviews</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.averageScore || 0}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">+{stats?.improvementRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Improvement</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats?.timeSpent || 0}h</p>
                <p className="text-sm text-muted-foreground">Time Practiced</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Interviews */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Recent Practice Sessions
                </CardTitle>
                <CardDescription>
                  Your latest interview practice history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInterviews.length > 0 ? recentInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <div className="font-medium">{interview.setup?.industry || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(interview.startTime).toLocaleDateString()} • {interview.messageCount} messages
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={interview.setup?.difficulty === 'hard' ? 'destructive' : interview.setup?.difficulty === 'medium' ? 'default' : 'secondary'}>
                          {interview.setup?.difficulty || 'Unknown'}
                        </Badge>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {interview.feedback?.confidenceScore || 'N/A'}
                            {interview.feedback?.confidenceScore && '%'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No interviews yet. Start practicing to see your history!</p>
                      <Button asChild className="mt-4">
                        <Link to="/onboarding">Start First Interview</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized suggestions to improve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-1">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {rec.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Weekly Goal Progress</CardTitle>
              <CardDescription>
                Complete 5 practice sessions this week to maintain your improvement streak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">3 of 5 sessions completed</span>
                  <span className="text-sm text-muted-foreground">60% complete</span>
                </div>
                <Progress value={60} className="h-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    2 more sessions to reach your weekly goal
                  </span>
                  <Button size="sm" asChild>
                    <Link to="/onboarding">Practice Now</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}