'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsultationsAPI } from '@/lib/api/consultations';
import { 
  Calendar,
  Clock, 
  User, 
  Video,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ClientConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  
  // 임시 데이터
  const mockConsultations = [
    {
      id: 1,
      expert: {
        id: 2,
        name: '김전문가',
        title: '아동발달 전문가',
        profile_image: null,
        specialties: ['집중력', 'ADHD', '학습장애'],
        rating: 4.8,
        experience_years: 10
      },
      scheduled_date: '2024-01-20',
      scheduled_time: '14:00',
      duration: 60,
      status: 'confirmed', // pending, confirmed, completed, cancelled
      topic: '6세 아이 집중력 문제 상담',
      description: '우리 아이가 집중을 잘 못해서 학습에 어려움이 있습니다. 전문가의 조언을 듣고 싶습니다.',
      meeting_url: 'https://meet.example.com/room123',
      created_at: '2024-01-15T10:30:00Z',
      price: 50000,
      rating: null,
      feedback: null,
      expert_notes: null
    },
    {
      id: 2,
      expert: {
        id: 3,
        name: '이언어치료사',
        title: '언어치료사',
        profile_image: null,
        specialties: ['언어발달', '언어치료', '의사소통'],
        rating: 4.9,
        experience_years: 8
      },
      scheduled_date: '2024-01-18',
      scheduled_time: '10:00',
      duration: 60,
      status: 'completed',
      topic: '5세 아이 언어발달 지연 상담',
      description: '또래에 비해 언어 발달이 늦는 것 같아 걱정입니다.',
      meeting_url: null,
      created_at: '2024-01-10T14:20:00Z',
      price: 60000,
      rating: 5,
      feedback: '매우 도움이 되었습니다. 구체적인 방법을 알려주셔서 감사해요.',
      expert_notes: '언어 자극 활동 권장, 3개월 후 재상담 예정'
    },
    {
      id: 3,
      expert: {
        id: 4,
        name: '박놀이치료사',
        title: '놀이치료사',
        profile_image: null,
        specialties: ['놀이치료', '사회성', '정서발달'],
        rating: 4.7,
        experience_years: 12
      },
      scheduled_date: '2024-01-25',
      scheduled_time: '16:00',
      duration: 60,
      status: 'pending',
      topic: '사회성 발달 상담',
      description: '또래 친구들과 어울리기 어려워하는 아이를 위한 상담',
      meeting_url: null,
      created_at: '2024-01-16T09:15:00Z',
      price: 55000,
      rating: null,
      feedback: null,
      expert_notes: null
    }
  ];

  useEffect(() => {
    loadConsultations();
  }, [filter]);

  const loadConsultations = async () => {
    try {
      // 실제 API 호출 시
      // const data = await ConsultationsAPI.getMyConsultations({
      //   status: filter !== 'all' ? filter : undefined
      // });
      // setConsultations(data.results);
      
      // 임시로 목 데이터 사용
      let filteredData = [...mockConsultations];
      
      if (filter === 'upcoming') {
        filteredData = filteredData.filter(c => ['pending', 'confirmed'].includes(c.status));
      } else if (filter === 'completed') {
        filteredData = filteredData.filter(c => c.status === 'completed');
      } else if (filter === 'cancelled') {
        filteredData = filteredData.filter(c => c.status === 'cancelled');
      }
      
      setConsultations(filteredData);
    } catch (error) {
      toast.error('상담 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (consultationId) => {
    if (!confirm('정말로 이 상담을 취소하시겠습니까?')) return;
    
    try {
      // await ConsultationsAPI.cancelConsultation(consultationId, '개인사정으로 취소');
      setConsultations(consultations.map(c => 
        c.id === consultationId ? { ...c, status: 'cancelled' } : c
      ));
      toast.success('상담이 취소되었습니다');
    } catch (error) {
      toast.error('상담 취소에 실패했습니다');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '승인 대기';
      case 'confirmed': return '예약 확정';
      case 'completed': return '상담 완료';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isUpcoming = (date, time) => {
    const consultationDateTime = new Date(`${date}T${time}`);
    return consultationDateTime > new Date();
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 상담 관리</h1>
              <p className="text-gray-600">예약한 상담을 확인하고 관리하세요</p>
            </div>
            <Link href="/client/consultations/book">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                새 상담 예약
              </Button>
            </Link>
          </div>

          {/* 필터 탭 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'upcoming', label: '예정된 상담' },
                  { key: 'completed', label: '완료된 상담' },
                  { key: 'cancelled', label: '취소된 상담' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === key
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 상담 목록 */}
          <div className="space-y-4">
            {consultations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    상담 내역이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    전문가와의 첫 상담을 예약해보세요
                  </p>
                  <Link href="/client/consultations/book">
                    <Button>상담 예약하기</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              consultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getStatusColor(consultation.status)}>
                            {getStatusIcon(consultation.status)}
                            <span className="ml-1">{getStatusText(consultation.status)}</span>
                          </Badge>
                          {consultation.status === 'confirmed' && isUpcoming(consultation.scheduled_date, consultation.scheduled_time) && (
                            <Badge className="bg-green-100 text-green-800">
                              <Calendar className="mr-1 h-3 w-3" />
                              다가오는 상담
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {consultation.topic}
                        </h3>
                        
                        <p className="text-gray-600 mb-4">
                          {consultation.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="font-medium">{consultation.expert.name}</span>
                              <span className="text-gray-500 ml-1">({consultation.expert.title})</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(consultation.scheduled_date)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatTime(consultation.scheduled_time)} ({consultation.duration}분)</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              상담료: {consultation.price.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        
                        {consultation.expert.specialties && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {consultation.expert.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {consultation.status === 'completed' && consultation.rating && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-medium mr-2">내 평가:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= consultation.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {consultation.feedback && (
                              <p className="text-sm text-gray-600">{consultation.feedback}</p>
                            )}
                          </div>
                        )}
                        
                        {consultation.expert_notes && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-900">전문가 소견:</span>
                            </div>
                            <p className="text-sm text-blue-800">{consultation.expert_notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {consultation.status === 'confirmed' && isUpcoming(consultation.scheduled_date, consultation.scheduled_time) && (
                          <>
                            {consultation.meeting_url && (
                              <a href={consultation.meeting_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm">
                                  <Video className="mr-1 h-4 w-4" />
                                  상담 참여
                                </Button>
                              </a>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCancel(consultation.id)}
                            >
                              취소
                            </Button>
                          </>
                        )}
                        
                        {consultation.status === 'completed' && !consultation.rating && (
                          <Link href={`/client/consultations/${consultation.id}/review`}>
                            <Button size="sm" variant="outline">
                              <Star className="mr-1 h-4 w-4" />
                              평가하기
                            </Button>
                          </Link>
                        )}
                        
                        <Link href={`/client/consultations/${consultation.id}`}>
                          <Button size="sm" variant="outline">
                            상세보기
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}