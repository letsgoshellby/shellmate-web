'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, Video, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboard() {
  return (
    <AuthGuard requiredRole="client">
      <DashboardLayout>
        <div className="space-y-6">
          {/* 환영 메시지 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">환영합니다!</h1>
            <p className="opacity-90">
              셸메이트에서 전문가들과 함께 아이의 성장을 도와보세요.
            </p>
          </div>
          
          {/* 빠른 액션 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/client/qna">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Q&A 질문하기</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">질문</div>
                  <p className="text-xs text-muted-foreground">
                    전문가에게 궁금한 점을 물어보세요
                  </p>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/client/columns">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">전문가 칼럼</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">읽기</div>
                  <p className="text-xs text-muted-foreground">
                    유익한 정보와 팁을 확인하세요
                  </p>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/client/consultations">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">상담 예약</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">예약</div>
                  <p className="text-xs text-muted-foreground">
                    1:1 비대면 상담을 예약하세요
                  </p>
                </CardContent>
              </Link>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">진행 상황</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">3</div>
                <p className="text-xs text-muted-foreground">
                  이번 달 상담 횟수
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* 최근 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>최근 Q&A</CardTitle>
                <CardDescription>최근에 올린 질문들을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">아이가 집중을 잘 못해요</h4>
                      <p className="text-xs text-muted-foreground">2일 전</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">답변완료</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">언어 발달이 늦는 것 같아요</h4>
                      <p className="text-xs text-muted-foreground">1주 전</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">해결됨</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Link href="/client/qna">모든 질문 보기</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>다가오는 상담</CardTitle>
                <CardDescription>예정된 상담 일정을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">김전문가와 상담</h4>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        12월 20일 오후 2시
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">이전문가와 상담</h4>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        12월 25일 오전 10시
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Link href="/client/consultations">모든 상담 보기</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}