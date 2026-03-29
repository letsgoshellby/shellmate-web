'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, FileText, CheckCircle } from 'lucide-react';
import { TokenStorage } from '@/lib/auth/tokenStorage';

export default function ExpertContractPage() {
  const router = useRouter();
  const [contractAgreed, setContractAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contractAgreed) {
      toast.error('전문가 서비스 제공 계약서에 동의해주세요');
      return;
    }

    setLoading(true);
    try {
      const accessToken = TokenStorage.getAccessToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/expert/signup/3/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          contract_agreed: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '계약서 동의에 실패했습니다' }));
        throw new Error(error.detail || '계약서 동의에 실패했습니다');
      }

      const data = await response.json();
      toast.success(data.message || '계약서 동의가 완료되었습니다!');

      // 사용자 정보 갱신
      window.location.href = '/signup/expert/bank-account';
    } catch (error) {
      console.error('계약서 동의 실패:', error);
      toast.error(error.message || '계약서 동의에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requiredRole="expert">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">전문가 서비스 제공 계약서</h1>
            <p className="text-gray-600">
              셸메이트 전문가로 활동하시기 위해 서비스 제공 계약서에 동의해주세요
            </p>
          </div>

          {/* 계약서 내용 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                전문가 서비스 제공 계약서
              </CardTitle>
              <CardDescription>
                아래 내용을 확인하시고 동의해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg max-h-[400px] overflow-y-auto space-y-4 text-sm">
                <div className="text-center mb-4">
                  <h2 className="font-bold text-lg">셸메이트 전문가 서비스 제공 계약서</h2>
                  <p className="text-gray-600 text-xs mt-1">체결일자: 2025년 nn월 nn일</p>
                </div>

                <section>
                  <h4 className="font-semibold mb-2">계약 당사자</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>셸비 (이하 &ldquo;회사&rdquo;)</li>
                    <li>전문가 회원 (이하 &ldquo;전문가&rdquo;)</li>
                  </ul>
                  <p className="text-gray-700 mt-2">
                    본 계약은 회사가 운영하는 느린학습자 분야 전문 상담 플랫폼 &ldquo;셸메이트(이하 &lsquo;서비스&rsquo;)&rdquo;에서 전문가가 이용자(보호자 회원)에게 상담을 제공함에 있어 양 당사자의 권리·의무 및 책임을 명확히 하기 위해 체결됩니다.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제1조 (계약의 목적)</h3>
                  <p className="text-gray-700">
                    본 계약은 회사가 운영하는 온라인 플랫폼을 통해 전문가가 보호자 회원에게 상담 서비스를 제공하고, 그에 따른 수익 정산, 개인정보 보호, 비밀유지, 책임 및 면책사항 등을 규정함을 목적으로 합니다.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제2조 (계약의 성격)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>본 계약은 용역(프리랜서) 형태의 독립사업자 계약으로, 전문가와 회사 간에는 근로관계, 고용관계, 위임·도급관계가 성립하지 않습니다.</li>
                    <li>전문가는 본인의 전문성에 따라 독립적으로 상담을 수행하며, 회사는 단순히 상담이 이루어질 수 있는 중개·플랫폼 환경만 제공합니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제3조 (계약기간)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>계약기간은 전문가의 서비스 가입 승인일로부터 1년으로 하며, 별도 해지 의사표시가 없을 경우 매년 자동 갱신됩니다.</li>
                    <li>회사 또는 전문가는 앱 탈퇴를 통해 계약 해지를 통보할 수 있습니다.</li>
                    <li>다만 제13조(계약의 해지)에 해당하는 경우, 회사는 즉시 일방적으로 해지할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제4조 (전문가 등록 및 자료 제출)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>전문가는 회사가 정한 등록 절차에 따라 자격증, 경력, 학력 등 관련 증빙자료를 제출해야 합니다.</li>
                    <li>제출된 자료의 내용이 사실과 다를 경우, 회사는 등록 승인을 취소하거나 계약을 해지할 수 있습니다.</li>
                    <li>전문가는 자격·소속·연락처 등 주요 정보가 변경될 경우 즉시 회사에 통보해야 합니다.</li>
                    <li>회사는 전문가의 적합성을 검증하기 위해 추가 자료 또는 온라인 면담을 요구할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제5조 (서비스 제공 및 운영)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>전문가는 회사 플랫폼 내에서만 상담을 진행해야 하며, 회사 외의 수단(개인 연락처, 메신저, SNS 등)을 통해 이용자와 직접 거래하거나 상담해서는 안 됩니다.</li>
                    <li>전문가는 이용자의 질문, 상담 요청 등에 성실히 응답하고, 상담 완료 후 반드시 상담결과지를 작성하여 회사 시스템 내에 등록해야 합니다.</li>
                    <li>상담은 회사가 지정한 영상 또는 음성 시스템에서만 진행해야 하며, 외부 플랫폼을 이용할 경우 회사의 사전 서면 승인을 받아야 합니다.</li>
                    <li>회사는 상담 품질 유지를 위해 일정 범위 내에서 상담 품질 점검, 피드백, 통계 분석을 수행할 수 있습니다.</li>
                    <li>회사는 상담 품질 유지를 위해 상담 내용의 일부 또는 전부를 녹음·녹화할 수 있으며, 해당 자료는 품질 관리 및 분쟁 예방 목적에 한해 5년간 보관 후 안전하게 폐기합니다.</li>
                    <li>녹음·녹화는 회사의 시스템을 통해 자동으로 이루어지며, 전문가는 이를 임의로 복제하거나 공유할 수 없습니다.</li>
                    <li>회사는 전문가의 상담 태도, 피드백, 후기 등을 토대로 서비스 내 노출 순서, 추천 알고리즘, 승인 여부 등을 결정할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제6조 (상담료 및 정산)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>상담료는 회사의 서비스 정책에 따라 이용자가 결제하며, 회사는 수수료를 공제한 금액을 전문가에게 지급합니다.</li>
                    <li>회사는 결제대행 수수료, PG 수수료, 플랫폼 운영비 등을 포함한 플랫폼 수수료(%)를 공제할 수 있습니다.</li>
                    <li>수수료율, 정산 주기, 환불 기준 등은 회사가 정하는 정책에 따르며, 전문가는 이에 동의합니다.</li>
                    <li>정산 주기: 매월 1일부터 말일까지의 상담 건을 기준으로 익월 15일 이내 지급합니다.</li>
                    <li>회사는 세법에 따라 3.3%의 원천징수세액을 공제 후 지급할 수 있습니다.</li>
                    <li>전문가의 계좌 정보 및 세금 신고를 위해 필요한 주민등록번호 등은 「개인정보보호법」 제24조에 따라 세무 목적에 한해 수집·이용됩니다.</li>
                    <li>전문가가 허위 상담결과 등록, 무단 취소, 노쇼 등으로 인한 이용자 환불 발생 시, 해당 금액은 차기 정산금에서 공제됩니다.</li>
                  </ul>
                  <div className="mt-2 ml-4">
                    <p className="font-medium text-gray-700 mb-1">활동 등급별 수수료율:</p>
                    <table className="w-full text-xs border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-1">등급</th>
                          <th className="border border-gray-300 p-1">기준</th>
                          <th className="border border-gray-300 p-1">수수료율</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-1">연두</td>
                          <td className="border border-gray-300 p-1">신규 전문가</td>
                          <td className="border border-gray-300 p-1">24%</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-1">청록</td>
                          <td className="border border-gray-300 p-1">상담 12건 이상</td>
                          <td className="border border-gray-300 p-1">19%</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-1">초록</td>
                          <td className="border border-gray-300 p-1">상담 50건 이상</td>
                          <td className="border border-gray-300 p-1">13%</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-1">🐢 셸비그린</td>
                          <td className="border border-gray-300 p-1">상담 100건 이상</td>
                          <td className="border border-gray-300 p-1">9%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mt-2">
                    <li>회사는 등급 기준 및 수수료율을 합리적인 사유로 변경할 수 있으며, 변경 시 최소 30일 전에 전문가에게 공지합니다.</li>
                    <li>수수료율은 매월 정산 시점의 등급 기준을 적용하며, 전문가가 허위로 기준을 달성할 경우 회사는 차액을 회수할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제7조 (세무 및 비용)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>전문가는 독립된 사업자로서 상담 수익에 대한 소득세 및 부가가치세 등 납세 의무를 부담합니다.</li>
                    <li>회사는 「소득세법」 제127조에 따라 전문가 수익에서 3.3%의 원천징수세액을 공제할 수 있으며, 필요 시 세무대행업체를 통해 신고·처리합니다.</li>
                    <li>세무대행을 위해 필요한 범위 내에서 전문가의 인적사항(이름, 주민등록번호 등)은 세무대행업체에 제공될 수 있습니다.</li>
                    <li>세금계산서 또는 현금영수증의 발행 주체는 관련 법령에 따라 결정합니다.</li>
                    <li>전문가가 개인사업자인 경우, 세금계산서 발행을 요청할 수 있으며, 사업자등록번호를 제출해야 합니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제8조 (저작권 및 지식재산권 및 업무상 결과물)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>전문가가 상담 과정에서 작성하거나 생성한 모든 자료(상담결과지, 녹음·녹화 파일, 메모, 보고서 등)의 저작권 및 소유권은 회사에 귀속됩니다.</li>
                    <li>단, 전문가의 창작 저작물(칼럼, 연구자료 등)은 예외로 하며, 회사는 서비스 운영 및 품질 개선 목적 범위 내에서 이를 비독점적으로 활용할 수 있습니다.</li>
                    <li>회사가 전문가의 저작물을 본 서비스 외의 용도로 활용하고자 하는 경우, 사전 동의를 받아야 합니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제9조 (비밀유지 및 개인정보 보호)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>양 당사자는 「개인정보보호법」 등 관련 법령을 준수합니다.</li>
                    <li>전문가는 상담 과정에서 취득한 이용자(보호자, 아동)의 개인정보, 상담내용, 건강·심리정보 등 일체를 제3자에게 누설·복제·전송·저장해서는 안 됩니다.</li>
                    <li>상담 데이터, 기록, 영상 등은 외부 클라우드 등에 복사하거나 공유하는 것을 금합니다.</li>
                    <li>전문가의 고의 또는 과실로 개인정보 유출이 발생할 경우, 회사는 손해액 전액 및 관련 법적 제재로 인한 비용을 구상 청구할 수 있습니다.</li>
                    <li>상담 관련 자료 및 기록은 회사의 보안 시스템 내에서만 작성·저장해야 합니다.</li>
                    <li>전문가는 상담 품질 향상 및 슈퍼비전 목적의 내부 검토 과정에서, 이용자의 개인정보를 가명 처리한 상태로 회사 내부 전문가에게 공유할 수 있습니다. 이 경우, 해당 자료는 품질관리 목적 외 사용이 금지됩니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제10조 (의료행위 금지)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>전문가는 의학적 자격이 없는 이상, 진단·치료 등 「의료법」상 의료행위 또는 의료유사행위를 제공해서는 안 됩니다.</li>
                    <li>상담은 교육적 조언 및 정서적 지지를 위한 목적에 한정되며, 의학적 판단으로 해석될 수 있는 행위를 할 경우 전문가가 전적인 책임을 부담합니다.</li>
                    <li>회사는 위 위반사항 발생 시 즉시 계약을 해지하고, 이용자 피해 발생 시 구상권을 행사할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제11조 (면책)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>회사는 플랫폼을 제공하는 자로서, 전문가가 제공하는 상담의 내용·품질·결과에 대해 책임지지 않습니다.</li>
                    <li>전문가는 자신의 상담 서비스로 인해 발생하는 민·형사상 분쟁 및 손해배상 책임을 전적으로 부담합니다.</li>
                    <li>이용자가 전문가의 조언에 따라 취한 조치나 결정으로 인해 발생한 손해에 대해 회사는 책임을 부담하지 않습니다.</li>
                    <li>다만, 회사의 고의 또는 중대한 과실로 인한 손해는 예외로 하며, 이 경우 손해배상 범위는 실제 발생한 직접손해에 한정됩니다.</li>
                    <li>회사는 천재지변, 통신장애, 제3자 공격, 시스템 오류 등 불가항력 사유로 인한 서비스 중단에 대해 면책됩니다.</li>
                    <li>전문가의 고의·과실로 인해 회사에 손해가 발생한 경우, 회사는 정산금에서 손해액을 공제하거나 별도 구상 청구를 할 수 있습니다.</li>
                    <li>상담 중 네트워크 불안정 등 기술적 문제로 10분 이상 중단될 경우, 회사는 문의 시 남은 시간을 동일 조건으로 재진행할 수 있도록 조치하며, 해당 사유가 전문가의 고의·과실이 아닐 경우 전문가에게 불이익이 발생하지 않습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제12조 (직접거래 금지)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>전문가는 플랫폼 외부에서 이용자와 직접 연락, 결제, 상담을 해서는 안 됩니다.</li>
                    <li>이를 위반하여 회사에 손해가 발생할 경우, 회사는 위반 1건당 정산예정금의 5배 상당의 위약벌을 청구할 수 있습니다.</li>
                    <li>회사는 위반이 확인된 경우 즉시 자격을 해지하고, 향후 재등록을 금지할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제13조 (계약의 해지)</h3>
                  <p className="text-gray-700 mb-2">
                    회사는 다음 사유가 2회 이상 누적되거나, 내부 품질평가 점수 기준 미달 시 계약을 해지할 수 있습니다. 단, 해지 전 최소 1회 전자메일로 시정 기회를 부여해야 합니다.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>허위 정보 또는 자격증 위조 제출</li>
                    <li>상담 중 개인정보 유출 또는 비밀유지 위반</li>
                    <li>음성·영상 녹화 외부 배포</li>
                    <li>회사 외부에서 이용자와 직접 거래</li>
                    <li>반복적인 상담 노쇼, 환불 유발, 불성실한 상담 수행 등 서비스 신뢰 저해 행위</li>
                    <li>의료행위 또는 허위 조언 등 법령 위반 행위</li>
                    <li>회사의 명예 또는 신뢰를 훼손한 행위</li>
                  </ul>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mt-2">
                    <li>회사는 해지 사유 발생 시 전문가의 미지급 정산금을 보류하거나 손해배상을 청구할 수 있습니다.</li>
                    <li>회사는 해지 사유 발생 시 전문가 정산금 일부 또는 전부를 보류할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제14조 (분쟁 해결 및 준거법)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>회사와 전문가 간 분쟁이 발생할 경우, 상호 협의로 해결을 원칙으로 하되, 해결되지 않을 경우 서울중앙지방법원을 관할법원으로 합니다.</li>
                    <li>본 계약에 명시되지 않은 사항은 대한민국 「민법」 및 관련 법령에 따릅니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">제15조 (계약서 효력)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>본 계약은 전자서명 또는 전자 클릭 동의로 효력이 발생합니다.</li>
                    <li>본 계약과 회사의 &ldquo;전문가용 서비스 이용약관&rdquo;의 내용이 상충할 경우, 본 계약의 내용이 우선합니다.</li>
                    <li>계약서의 각 조항은 법적 효력을 가지며, 일부 조항이 무효가 되더라도 나머지 조항의 효력에는 영향을 미치지 않습니다.</li>
                  </ul>
                </section>
              </div>

              {/* 동의 체크박스 */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="contract_agreed"
                      checked={contractAgreed}
                      onCheckedChange={(checked) => setContractAgreed(checked)}
                      className="mt-1"
                    />
                    <Label
                      htmlFor="contract_agreed"
                      className="text-sm font-medium cursor-pointer leading-relaxed"
                    >
                      (필수) 전문가 서비스 제공 계약서의 내용을 모두 확인하였으며, 이에 동의합니다.
                    </Label>
                  </div>
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={!contractAgreed || loading}
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        동의하고 시작하기
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
