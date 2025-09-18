'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IoChatbubbleEllipses, IoDocumentText, IoVideocam, IoPeople, IoTrendingUp, IoTime } from 'react-icons/io5';
import Link from 'next/link';

export default function ExpertDashboard() {
  return (
    <AuthGuard requiredRole="expert">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 환영 메시지 */}
          <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">안녕하세요, 전문가님!</h1>
            <p className="opacity-90">
              오늘도 많은 가정에 도움을 주시는 소중한 활동을 해주셔서 감사합니다.
            </p>
          </div>
          
          {/* 통계 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">대기 중인 질문</CardTitle>
                <IoChatbubbleEllipses className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <p className="text-xs text-muted-foreground">
                  답변을 기다리는 질문
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 상담</CardTitle>
                <IoVideocam className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-xs text-muted-foreground">
                  완료된 상담 세션
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">도움받은 가정</CardTitle>
                <IoPeople className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">23</div>
                <p className="text-xs text-muted-foreground">
                  이번 달 상담한 가정 수
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">만족도 평균</CardTitle>
                <IoTrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">4.8</div>
                <p className="text-xs text-muted-foreground">
                  5점 만점 기준
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* 빠른 액션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expert/qna">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IoChatbubbleEllipses className="mr-2 h-5 w-5" />
                    Q&A 답변하기
                  </CardTitle>
                  <CardDescription>
                    대기 중인 질문에 답변해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">답변하러 가기</Button>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expert/columns">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IoDocumentText className="mr-2 h-5 w-5" />
                    칼럼 작성하기
                  </CardTitle>
                  <CardDescription>
                    유익한 정보를 칼럼으로 공유해보세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">칼럼 작성</Button>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/expert/consultations">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IoVideocam className="mr-2 h-5 w-5" />
                    상담 일정 관리
                  </CardTitle>
                  <CardDescription>
                    상담 예약과 일정을 관리하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">일정 관리</Button>
                </CardContent>
              </Link>
            </Card>
          </div>
          
          {/* 최근 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>최근 답변한 질문</CardTitle>
                <CardDescription>최근에 답변하신 Q&A 목록입니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">아이의 언어 발달 지연에 대해</h4>
                      <p className="text-xs text-muted-foreground">1시간 전 답변</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">완료</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">집중력 향상 방법</h4>
                      <p className="text-xs text-muted-foreground">어제 답변</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">채택됨</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">사회성 발달 도움 방법</h4>
                      <p className="text-xs text-muted-foreground">3일 전 답변</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">완료</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  모든 답변 보기
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>오늘의 상담 일정</CardTitle>
                <CardDescription>오늘 예정된 상담 세션입니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">김○○ 학부모 상담</h4>
                      <p className="text-xs text-muted-foreground">
                        <IoTime className="w-3 h-3 inline mr-1" />
                        오후 2:00 - 3:00
                      </p>
                    </div>
                    <Button size="sm" variant="outline">참여</Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">이○○ 학부모 상담</h4>
                      <p className="text-xs text-muted-foreground">
                        <IoTime className="w-3 h-3 inline mr-1" />
                        오후 4:00 - 5:00
                      </p>
                    </div>
                    <Button size="sm" variant="outline">준비</Button>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  전체 일정 보기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}