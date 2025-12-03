import { Link } from 'react-router-dom';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Button, Card } from '@/components/ui';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';

export const HomePage = () => {
    const features = [
        {
            icon: BookOpen,
            title: 'Rich Course Content',
            description: 'Access a wide variety of courses with video lessons, quizzes, and assignments.',
        },
        {
            icon: Users,
            title: 'Expert Instructors',
            description: 'Learn from industry professionals and experienced educators.',
        },
        {
            icon: Award,
            title: 'Certificates',
            description: 'Earn certificates upon course completion to showcase your achievements.',
        },
        {
            icon: TrendingUp,
            title: 'Track Progress',
            description: 'Monitor your learning journey with detailed progress tracking.',
        },
    ];

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-5xl font-bold mb-6">
                            Welcome to {APP_NAME}
                        </h1>
                        <p className="text-xl mb-8 text-primary-100">
                            Your journey to mastery starts here. Learn at your own pace with expert-led courses.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link to={ROUTES.REGISTER}>
                                <Button size="lg" className="bg-white text-primary-600 hover:bg-secondary-50">
                                    Get Started Free
                                </Button>
                            </Link>
                            <Link to={ROUTES.COURSES}>
                                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                                    Browse Courses
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                            Why Choose {APP_NAME}?
                        </h2>
                        <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
                            We provide everything you need to succeed in your learning journey.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Card key={feature.title} variant="elevated" padding="lg">
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-secondary-600">{feature.description}</p>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-secondary-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
                    <p className="text-lg text-secondary-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of learners who are already advancing their skills with {APP_NAME}.
                    </p>
                    <Link to={ROUTES.REGISTER}>
                        <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
                            Sign Up Now
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

