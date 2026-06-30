'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import {
  IoPerson, IoMail, IoCall, IoCalendar, IoPeople, IoSettings,
  IoCreate, IoSave, IoClose, IoCheckmarkCircle, IoArrowForward, IoArrowBack,
} from 'react-icons/io5';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TokenStorage } from '@/lib/auth/tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const LEARNING_PROBLEM_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'reading', label: '읽기' },
  { value: 'writing', label: '쓰기' },
  { value: 'math', label: '수학' },
  { value: 'speaking', label: '말하기' },
  { value: 'concentration', label: '집중력' },
  { value: 'comprehension', label: '이해력' },
  { value: 'memory', label: '기억력' },
  { value: 'other', label: '기타' },
];

const WORRIES_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'sociality', label: '사회성' },
  { value: 'school_adjustment', label: '학교적응' },
  { value: 'interpersonal_relationships', label: '대인관계' },
  { value: 'other', label: '기타' },
];

const EMOTIONAL_ANXIETY_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'obsessive_compulsive', label: '강박' },
  { value: 'tic', label: '틱' },
  { value: 'social_anxiety', label: '사회불안' },
  { value: 'other', label: '기타' },
];

const DIAGNOSIS_OPTIONS = [
  { value: 'hospital', label: '병원 진단' },
  { value: 'school', label: '학교 평가' },
  { value: 'other', label: '기타' },
  { value: 'none', label: '없음' },
];

const INTEREST_OPTIONS = [
  { value: 'academic', label: '학업' },
  { value: 'friendship', label: '친구관계' },
  { value: 'language', label: '언어' },
  { value: 'emotional_anxiety', label: '정서 불안' },
  { value: 'behavioral_issues', label: '행동 문제' },
  { value: 'career_planning', label: '진로 설계' },
  { value: 'parenting_discipline', label: '가정 육아 / 훈육' },
];

const CHILD_ORDER_MAP = { first: '첫째', second: '둘째', third_or_more: '셋째 이상' };
const GENDER_MAP = { male: '남자', female: '여자' };

export default function ClientProfilePage() {
  const { isAuthenticated, isClient, user, refreshUser } = useAuth();
  const router = useRouter();

  // User profile state
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editData, setEditData] = useState({});

  // Child info edit state
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [childEditStep, setChildEditStep] = useState(1);
  const [childLoading, setChildLoading] = useState(false);

  // Child step 1 state
  const [step1Data, setStep1Data] = useState({
    birth_date: '',
    gender: '',
    child_order: '',
    psychological_test_conducted: undefined,
    learning_problem_detail: '',
    worries_detail: '',
    family_similar_symptoms: undefined,
    medication_usage: undefined,
  });
  const [selectedLearningProblems, setSelectedLearningProblems] = useState([]);
  const [selectedWorries, setSelectedWorries] = useState([]);
  const [selectedEmotionalProblems, setSelectedEmotionalProblems] = useState([]);

  // Child step 2 state
  const [step2Data, setStep2Data] = useState({
    official_diagnosis_detail: '',
    diagnosis_test_name: '',
    diagnosis_result: '',
    diagnosis_date: '',
    treatment_status: '',
    treatment_detail: '',
    counseling_status: '',
    counseling_detail: '',
    learning_characteristics: '',
    lifestyle_characteristics: '',
  });
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([]);

  // Child step 3 state
  const [selectedInterests, setSelectedInterests] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isClient) {
      router.push('/');
      return;
    }
    fetchProfileData();
  }, [isAuthenticated, isClient, router]);

  // AuthContext user로 profileData 초기화 (캐시된 데이터 즉시 표시)
  useEffect(() => {
    if (user && !profileData) {
      setProfileData(user);
      setEditData({
        name: user.name || '',
        nickname: user.nickname || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const token = TokenStorage.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/user/me/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditData({
          name: data.name || '',
          nickname: data.nickname || '',
          phone_number: data.phone_number || '',
        });
      }
    } catch {
      toast.error('프로필 정보를 불러오는데 실패했습니다');
    }
  };

  const isStep1Completed = () => {
    const child = profileData?.child;
    return child && child.birth_date && child.gender;
  };

  const isStep2Completed = () => {
    const child = profileData?.child;
    return child && child.official_diagnosis && child.official_diagnosis.length > 0;
  };

  const isStep3Completed = () => profileData?.main_interests?.length > 0;

  const getOverallStatus = () => {
    if (isStep3Completed()) return 'completed';
    if (isStep2Completed()) return 'step2_completed';
    if (isStep1Completed()) return 'step1_completed';
    return 'basic';
  };

  const getSignupStatusBadge = () => {
    const status = getOverallStatus();
    const statusMap = {
      basic: { label: '미완료', variant: 'secondary' },
      step1_completed: { label: '1단계 완료', variant: 'secondary' },
      step2_completed: { label: '2단계 완료', variant: 'default' },
      completed: { label: '완료', variant: 'default' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // ── User profile handlers ──────────────────────────────────────────────────
  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: profileData?.name || '',
      nickname: profileData?.nickname || '',
      phone_number: profileData?.phone_number || '',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/user/me/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setIsEditing(false);
        toast.success('프로필이 업데이트되었습니다');
      } else {
        const err = await response.json().catch(() => ({}));
        const firstError = Object.values(err).flat()[0];
        toast.error(firstError || '프로필 업데이트에 실패했습니다');
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // ── Child edit handlers ────────────────────────────────────────────────────
  const handleChildEdit = () => {
    const child = profileData?.child;
    setStep1Data({
      birth_date: child?.birth_date || '',
      gender: child?.gender || '',
      child_order: child?.child_order || '',
      psychological_test_conducted: child?.psychological_test_conducted,
      learning_problem_detail: child?.learning_problem_detail || '',
      worries_detail: child?.worries_detail || '',
      family_similar_symptoms: child?.family_similar_symptoms,
      medication_usage: child?.medication_usage,
    });
    setSelectedLearningProblems(child?.learning_problem || []);
    setSelectedWorries(child?.worries || []);
    setSelectedEmotionalProblems(child?.emotional_anxiety_problem || []);

    setStep2Data({
      official_diagnosis_detail: child?.official_diagnosis_detail || '',
      diagnosis_test_name: child?.diagnosis_test_name || '',
      diagnosis_result: child?.diagnosis_result || '',
      diagnosis_date: child?.diagnosis_date || '',
      treatment_status: child?.treatment_status || '',
      treatment_detail: child?.treatment_detail || '',
      counseling_status: child?.counseling_status || '',
      counseling_detail: child?.counseling_detail || '',
      learning_characteristics: child?.learning_characteristics || '',
      lifestyle_characteristics: child?.lifestyle_characteristics || '',
    });
    setSelectedDiagnosis(child?.official_diagnosis || []);
    setSelectedInterests(profileData?.main_interests || []);
    setChildEditStep(1);
    setIsEditingChild(true);
  };

  const handleChildCancel = () => {
    setIsEditingChild(false);
    setChildEditStep(1);
  };

  const patchOrPost = async (url, body, token) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const patchRes = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (patchRes.status === 404) {
      return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    }
    return patchRes;
  };

  const saveChildStep1 = async () => {
    setChildLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      const response = await patchOrPost(`${API_BASE_URL}/me/client/child/`, {
        ...step1Data,
        learning_problem: selectedLearningProblems,
        worries: selectedWorries,
        emotional_anxiety_problem: selectedEmotionalProblems,
      }, token);
      if (response.ok) { await fetchProfileData(); await refreshUser(); return true; }
      const err = await response.json();
      toast.error(err.detail || '저장에 실패했습니다');
      return false;
    } catch {
      toast.error('네트워크 오류가 발생했습니다');
      return false;
    } finally {
      setChildLoading(false);
    }
  };

  const saveChildStep2 = async () => {
    setChildLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      const response = await patchOrPost(`${API_BASE_URL}/me/client/child/additional-info/`,
        { ...step2Data, official_diagnosis: selectedDiagnosis }, token);
      if (response.ok) { await fetchProfileData(); return true; }
      const err = await response.json();
      toast.error(err.detail || '저장에 실패했습니다');
      return false;
    } catch {
      toast.error('네트워크 오류가 발생했습니다');
      return false;
    } finally {
      setChildLoading(false);
    }
  };

  const saveChildStep3 = async () => {
    setChildLoading(true);
    try {
      const token = TokenStorage.getAccessToken();
      const url = `${API_BASE_URL}/me/client/interests/`;
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const body = JSON.stringify({ main_interests: selectedInterests });

      let response = await fetch(url, { method: 'POST', headers, body });
      if (response.status === 409) {
        response = await fetch(url, { method: 'PATCH', headers, body });
      }

      if (response.ok) {
        setProfileData(prev => ({ ...prev, main_interests: selectedInterests }));
        return true;
      }

      const err = await response.json();
      toast.error(err.detail || '저장에 실패했습니다');
      return false;
    } catch {
      toast.error('네트워크 오류가 발생했습니다');
      return false;
    } finally {
      setChildLoading(false);
    }
  };

  const handleChildNext = async () => {
    if (childEditStep === 1) {
      const ok = await saveChildStep1();
      if (ok) { toast.success('1단계가 저장되었습니다'); setChildEditStep(2); }
    } else if (childEditStep === 2) {
      const ok = await saveChildStep2();
      if (ok) { toast.success('2단계가 저장되었습니다'); setChildEditStep(3); }
    }
  };

  const handleChildSkip = () => {
    if (childEditStep === 2) setChildEditStep(3);
  };

  const handleChildComplete = async () => {
    const ok = await saveChildStep3();
    if (ok) {
      toast.success('아이 정보가 업데이트되었습니다');
      setIsEditingChild(false);
      setChildEditStep(1);
    }
  };

  const handleChildSkipAndClose = () => {
    setIsEditingChild(false);
    setChildEditStep(1);
  };

  const toggleCheckbox = (value, selected, setSelected) => {
    setSelected(selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]);
  };

  const formatDate = (value) => {
    const n = value.replace(/[^\d]/g, '');
    if (n.length <= 4) return n;
    if (n.length <= 6) return `${n.slice(0, 4)}-${n.slice(4)}`;
    return `${n.slice(0, 4)}-${n.slice(4, 6)}-${n.slice(6, 8)}`;
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[
        { n: 1, label: '아이 정보', required: true },
        { n: 2, label: '추가 정보', required: false },
        { n: 3, label: '관심사', required: false },
      ].map(({ n, label, required }, i, arr) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              childEditStep === n ? 'bg-primary text-primary-foreground' :
              childEditStep > n ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {childEditStep > n ? <IoCheckmarkCircle className="h-4 w-4" /> : n}
            </div>
            <span className="text-xs mt-1 text-gray-500">{label}</span>
            {!required && <span className="text-xs text-gray-400">(선택)</span>}
          </div>
          {i < arr.length - 1 && (
            <div className={`h-0.5 w-12 mb-4 mx-1 ${childEditStep > n ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderChildViewMode = () => {
    const child = profileData?.child;
    if (!child || !child.birth_date) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-3">아이 정보가 아직 입력되지 않았습니다.</p>
          <Button size="sm" onClick={handleChildEdit}>
            <IoCreate className="h-4 w-4 mr-2" />
            정보 입력하기
          </Button>
        </div>
      );
    }

    const labelOf = (opts, vals) =>
      (Array.isArray(vals) ? vals : [vals])
        .map(v => opts.find(o => o.value === v)?.label || v)
        .join(', ');

    return (
      <div className="space-y-6">
        {/* 1단계 */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3 pb-1 border-b">1단계: 아이 정보</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">생년월일</Label>
              <Input value={child.birth_date || '-'} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">성별</Label>
              <Input value={GENDER_MAP[child.gender] || '-'} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">몇째</Label>
              <Input value={CHILD_ORDER_MAP[child.child_order] || '-'} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">심리검사 여부</Label>
              <Input
                value={child.psychological_test_conducted === true ? '있음' : child.psychological_test_conducted === false ? '없음' : '-'}
                disabled className="bg-gray-50"
              />
            </div>
            {child.learning_problem?.length > 0 && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-gray-500">학습 문제</Label>
                <div className="flex flex-wrap gap-1">
                  {child.learning_problem.map(v => (
                    <Badge key={v} variant="outline">{labelOf(LEARNING_PROBLEM_OPTIONS, v)}</Badge>
                  ))}
                </div>
              </div>
            )}
            {child.worries?.length > 0 && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-gray-500">고민/걱정</Label>
                <div className="flex flex-wrap gap-1">
                  {child.worries.map(v => (
                    <Badge key={v} variant="outline">{labelOf(WORRIES_OPTIONS, v)}</Badge>
                  ))}
                </div>
              </div>
            )}
            {child.emotional_anxiety_problem?.length > 0 && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-gray-500">정서 및 불안 문제</Label>
                <div className="flex flex-wrap gap-1">
                  {child.emotional_anxiety_problem.map(v => (
                    <Badge key={v} variant="outline">{labelOf(EMOTIONAL_ANXIETY_OPTIONS, v)}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">가족력</Label>
              <Input
                value={child.family_similar_symptoms === true ? '있음' : child.family_similar_symptoms === false ? '없음' : '-'}
                disabled className="bg-gray-50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">약물 복용</Label>
              <Input
                value={child.medication_usage === true ? '있음' : child.medication_usage === false ? '없음' : '-'}
                disabled className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* 2단계 */}
        {isStep2Completed() && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3 pb-1 border-b">2단계: 추가 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {child.official_diagnosis?.length > 0 && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-500">공식 진단 여부</Label>
                  <div className="flex flex-wrap gap-1">
                    {child.official_diagnosis.map(v => (
                      <Badge key={v} variant="outline">{labelOf(DIAGNOSIS_OPTIONS, v)}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {child.official_diagnosis_detail && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-500">진단 상세 메모</Label>
                  <Textarea value={child.official_diagnosis_detail} disabled className="bg-gray-50 resize-none" rows={2} />
                </div>
              )}
              {child.diagnosis_test_name && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">공식 진단명</Label>
                  <Input value={child.diagnosis_test_name} disabled className="bg-gray-50" />
                </div>
              )}
              {child.diagnosis_date && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">진단 일자</Label>
                  <Input value={child.diagnosis_date} disabled className="bg-gray-50" />
                </div>
              )}
              {child.diagnosis_result && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-500">검사 결과</Label>
                  <Textarea value={child.diagnosis_result} disabled className="bg-gray-50 resize-none" rows={2} />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">치료 여부</Label>
                <Input value={child.treatment_status === 'treatment' ? '치료 중' : child.treatment_status === 'none' ? '안 함' : '-'} disabled className="bg-gray-50" />
              </div>
              {child.treatment_detail && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">치료 상세</Label>
                  <Input value={child.treatment_detail} disabled className="bg-gray-50" />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">상담 여부</Label>
                <Input value={child.counseling_status === 'counseling' ? '상담 중' : child.counseling_status === 'none' ? '안 함' : '-'} disabled className="bg-gray-50" />
              </div>
              {child.counseling_detail && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">상담 상세</Label>
                  <Input value={child.counseling_detail} disabled className="bg-gray-50" />
                </div>
              )}
              {child.learning_characteristics && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-500">아동 학습 특성</Label>
                  <Textarea value={child.learning_characteristics} disabled className="bg-gray-50 resize-none" rows={2} />
                </div>
              )}
              {child.lifestyle_characteristics && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs text-gray-500">생활 특성</Label>
                  <Textarea value={child.lifestyle_characteristics} disabled className="bg-gray-50 resize-none" rows={2} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3단계 */}
        {profileData?.main_interests?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3 pb-1 border-b">3단계: 관심사</h4>
            <div className="flex flex-wrap gap-1">
              {profileData.main_interests.map(v => (
                <Badge key={v} variant="secondary">
                  {INTEREST_OPTIONS.find(o => o.value === v)?.label || v}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChildStep1Form = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold border-b pb-2">기본 정보</h3>
        <div className="space-y-2">
          <Label htmlFor="birth_date">생년월일 *</Label>
          <Input
            id="birth_date"
            placeholder="2010-01-01"
            maxLength={10}
            value={step1Data.birth_date}
            onChange={(e) => setStep1Data({ ...step1Data, birth_date: formatDate(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>성별 *</Label>
          <RadioGroup value={step1Data.gender} onValueChange={(v) => setStep1Data({ ...step1Data, gender: v })} className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="edit_male" /><Label htmlFor="edit_male" className="font-normal cursor-pointer">남자</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="edit_female" /><Label htmlFor="edit_female" className="font-normal cursor-pointer">여자</Label></div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label>몇째 아이인가요? *</Label>
          <RadioGroup value={step1Data.child_order} onValueChange={(v) => setStep1Data({ ...step1Data, child_order: v })} className="flex gap-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="first" id="edit_first" /><Label htmlFor="edit_first" className="font-normal cursor-pointer">첫째</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="second" id="edit_second" /><Label htmlFor="edit_second" className="font-normal cursor-pointer">둘째</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="third_or_more" id="edit_third" /><Label htmlFor="edit_third" className="font-normal cursor-pointer">셋째 이상</Label></div>
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold border-b pb-2">세부 정보</h3>
        <div className="space-y-2">
          <Label>웩슬러 검사 등 관련 검사를 시행한 적이 있나요? *</Label>
          <RadioGroup
            value={step1Data.psychological_test_conducted === true ? 'yes' : step1Data.psychological_test_conducted === false ? 'no' : ''}
            onValueChange={(v) => setStep1Data({ ...step1Data, psychological_test_conducted: v === 'yes' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="edit_psych_yes" /><Label htmlFor="edit_psych_yes" className="font-normal cursor-pointer">네</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="edit_psych_no" /><Label htmlFor="edit_psych_no" className="font-normal cursor-pointer">아니오</Label></div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>학습 문제 * (복수 선택 가능)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEARNING_PROBLEM_OPTIONS.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit_lp_${value}`}
                  checked={selectedLearningProblems.includes(value)}
                  onCheckedChange={() => toggleCheckbox(value, selectedLearningProblems, setSelectedLearningProblems)}
                />
                <Label htmlFor={`edit_lp_${value}`} className="font-normal cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          {selectedLearningProblems.includes('other') && (
            <Textarea
              placeholder="기타 학습 문제를 입력해주세요"
              value={step1Data.learning_problem_detail}
              onChange={(e) => setStep1Data({ ...step1Data, learning_problem_detail: e.target.value })}
              rows={2}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>고민/걱정 * (복수 선택 가능)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WORRIES_OPTIONS.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit_w_${value}`}
                  checked={selectedWorries.includes(value)}
                  onCheckedChange={() => toggleCheckbox(value, selectedWorries, setSelectedWorries)}
                />
                <Label htmlFor={`edit_w_${value}`} className="font-normal cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          {selectedWorries.includes('other') && (
            <Textarea
              placeholder="기타 고민/걱정을 입력해주세요"
              value={step1Data.worries_detail}
              onChange={(e) => setStep1Data({ ...step1Data, worries_detail: e.target.value })}
              rows={2}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>정서 및 불안 문제 * (복수 선택 가능)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EMOTIONAL_ANXIETY_OPTIONS.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`edit_ea_${value}`}
                  checked={selectedEmotionalProblems.includes(value)}
                  onCheckedChange={() => toggleCheckbox(value, selectedEmotionalProblems, setSelectedEmotionalProblems)}
                />
                <Label htmlFor={`edit_ea_${value}`} className="font-normal cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>가족 중 유사한 증상을 경험한 분이 있나요? *</Label>
          <RadioGroup
            value={step1Data.family_similar_symptoms === true ? 'yes' : step1Data.family_similar_symptoms === false ? 'no' : undefined}
            onValueChange={(v) => setStep1Data({ ...step1Data, family_similar_symptoms: v === 'yes' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="edit_fam_yes" /><Label htmlFor="edit_fam_yes" className="font-normal cursor-pointer">네</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="edit_fam_no" /><Label htmlFor="edit_fam_no" className="font-normal cursor-pointer">아니오</Label></div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>현재 복용 중인 약물이 있나요? *</Label>
          <RadioGroup
            value={step1Data.medication_usage === true ? 'yes' : step1Data.medication_usage === false ? 'no' : undefined}
            onValueChange={(v) => setStep1Data({ ...step1Data, medication_usage: v === 'yes' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="edit_med_yes" /><Label htmlFor="edit_med_yes" className="font-normal cursor-pointer">네</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="edit_med_no" /><Label htmlFor="edit_med_no" className="font-normal cursor-pointer">아니오</Label></div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderChildStep2Form = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>공식 진단 여부 * (복수 선택 가능)</Label>
        <div className="grid grid-cols-2 gap-2">
          {DIAGNOSIS_OPTIONS.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`edit_diag_${value}`}
                checked={selectedDiagnosis.includes(value)}
                onCheckedChange={(checked) => {
                  setSelectedDiagnosis(checked
                    ? [...selectedDiagnosis, value]
                    : selectedDiagnosis.filter(v => v !== value));
                }}
              />
              <Label htmlFor={`edit_diag_${value}`} className="font-normal cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label>진단 상세 메모 (최대 100자)</Label>
          <Textarea
            placeholder="진단 관련 추가 내용을 입력해주세요"
            value={step2Data.official_diagnosis_detail}
            onChange={(e) => setStep2Data({ ...step2Data, official_diagnosis_detail: e.target.value })}
            maxLength={100}
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>공식 진단명</Label>
            <Input
              placeholder="공식 진단명"
              value={step2Data.diagnosis_test_name}
              onChange={(e) => setStep2Data({ ...step2Data, diagnosis_test_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>진단 일자</Label>
            <Input
              placeholder="예: 2024-03-15"
              value={step2Data.diagnosis_date}
              onChange={(e) => setStep2Data({ ...step2Data, diagnosis_date: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>검사 결과</Label>
          <Textarea
            placeholder="검사 결과를 입력해주세요"
            value={step2Data.diagnosis_result}
            onChange={(e) => setStep2Data({ ...step2Data, diagnosis_result: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>현재 치료 여부 *</Label>
        <RadioGroup value={step2Data.treatment_status} onValueChange={(v) => setStep2Data({ ...step2Data, treatment_status: v })} className="flex gap-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="treatment" id="edit_treat_yes" /><Label htmlFor="edit_treat_yes" className="font-normal cursor-pointer">치료</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="edit_treat_none" /><Label htmlFor="edit_treat_none" className="font-normal cursor-pointer">안 함</Label></div>
        </RadioGroup>
        {step2Data.treatment_status === 'treatment' && (
          <Textarea
            placeholder="치료 관련 내용을 입력해주세요 (최대 200자)"
            value={step2Data.treatment_detail}
            onChange={(e) => setStep2Data({ ...step2Data, treatment_detail: e.target.value })}
            maxLength={200}
            rows={2}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>현재 상담 여부 *</Label>
        <RadioGroup value={step2Data.counseling_status} onValueChange={(v) => setStep2Data({ ...step2Data, counseling_status: v })} className="flex gap-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="counseling" id="edit_counsel_yes" /><Label htmlFor="edit_counsel_yes" className="font-normal cursor-pointer">상담</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="edit_counsel_none" /><Label htmlFor="edit_counsel_none" className="font-normal cursor-pointer">안 함</Label></div>
        </RadioGroup>
        {step2Data.counseling_status === 'counseling' && (
          <Textarea
            placeholder="상담 관련 내용을 입력해주세요 (최대 200자)"
            value={step2Data.counseling_detail}
            onChange={(e) => setStep2Data({ ...step2Data, counseling_detail: e.target.value })}
            maxLength={200}
            rows={2}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>아동 학습 특성 (최대 100자)</Label>
        <Textarea
          placeholder="아동의 학습 특성을 입력해주세요"
          value={step2Data.learning_characteristics}
          onChange={(e) => setStep2Data({ ...step2Data, learning_characteristics: e.target.value })}
          maxLength={100}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>생활 특성 (최대 100자)</Label>
        <Textarea
          placeholder="아동의 생활 특성을 입력해주세요"
          value={step2Data.lifestyle_characteristics}
          onChange={(e) => setStep2Data({ ...step2Data, lifestyle_characteristics: e.target.value })}
          maxLength={100}
          rows={3}
        />
      </div>
    </div>
  );

  const renderChildStep3Form = () => (
    <div className="space-y-4">
      <Label className="text-base font-medium">주요 관심사 (최대 3개)</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INTEREST_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Checkbox
              id={`edit_int_${option.value}`}
              checked={selectedInterests.includes(option.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  if (selectedInterests.length >= 3) { toast.error('최대 3개까지 선택할 수 있습니다'); return; }
                  setSelectedInterests([...selectedInterests, option.value]);
                } else {
                  setSelectedInterests(selectedInterests.filter(v => v !== option.value));
                }
              }}
            />
            <Label htmlFor={`edit_int_${option.value}`} className="font-normal cursor-pointer flex-1">{option.label}</Label>
          </div>
        ))}
      </div>
      {selectedInterests.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>선택된 관심사 ({selectedInterests.length}/3):</strong>{' '}
            {selectedInterests.map(v => INTEREST_OPTIONS.find(o => o.value === v)?.label).join(', ')}
          </p>
        </div>
      )}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">내 프로필</h1>
            <p className="text-gray-600 mt-2">개인정보 및 회원가입 현황을 확인하고 수정할 수 있습니다.</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">기본 정보</TabsTrigger>
              <TabsTrigger value="status">가입 현황</TabsTrigger>
            </TabsList>

            {/* ── 기본 정보 탭 ── */}
            <TabsContent value="profile" className="space-y-6">
              {/* 내 기본 정보 카드 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IoPerson className="h-5 w-5" />
                      기본 정보
                    </CardTitle>
                    <CardDescription>
                      회원가입 시 입력한 기본 정보를 확인하고 수정할 수 있습니다.
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={handleEdit} variant="outline" size="sm">
                      <IoCreate className="h-4 w-4 mr-2" />
                      수정
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <IoClose className="h-4 w-4 mr-2" />
                        취소
                      </Button>
                      <Button onClick={handleSave} size="sm" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <IoSave className="h-4 w-4 mr-2" />}
                        저장
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <IoMail className="h-4 w-4" />이메일
                      </Label>
                      <Input id="email" value={profileData.email ?? ''} disabled className="bg-gray-50" />
                      <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      {isEditing ? (
                        <Input id="name" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                      ) : (
                        <Input value={profileData.name ?? ''} disabled className="bg-gray-50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nickname">닉네임</Label>
                      {isEditing ? (
                        <Input id="nickname" value={editData.nickname} onChange={(e) => setEditData({ ...editData, nickname: e.target.value })} />
                      ) : (
                        <Input value={profileData.nickname ?? ''} disabled className="bg-gray-50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <IoCall className="h-4 w-4" />전화번호
                      </Label>
                      {isEditing ? (
                        <Input id="phone" value={editData.phone_number} onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })} />
                      ) : (
                        <Input value={profileData.phone_number ?? ''} disabled className="bg-gray-50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <IoPeople className="h-4 w-4" />회원 유형
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">학부모 (내담자)</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <IoCalendar className="h-4 w-4" />가입일
                      </Label>
                      <Input value={new Date(profileData.created_at).toLocaleDateString('ko-KR')} disabled className="bg-gray-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 아이 정보 카드 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IoPerson className="h-5 w-5" />
                      아이 정보
                    </CardTitle>
                    <CardDescription>
                      아이의 정보를 확인하고 수정할 수 있습니다.
                    </CardDescription>
                  </div>
                  {!isEditingChild ? (
                    isStep1Completed() && (
                      <Button onClick={handleChildEdit} variant="outline" size="sm">
                        <IoCreate className="h-4 w-4 mr-2" />
                        수정
                      </Button>
                    )
                  ) : (
                    <Button onClick={handleChildCancel} variant="outline" size="sm">
                      <IoClose className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!isEditingChild ? (
                    renderChildViewMode()
                  ) : (
                    <div>
                      {renderStepIndicator()}

                      <div className="max-h-[60vh] overflow-y-auto pr-1">
                        {childEditStep === 1 && renderChildStep1Form()}
                        {childEditStep === 2 && renderChildStep2Form()}
                        {childEditStep === 3 && renderChildStep3Form()}
                      </div>

                      <div className="flex justify-between pt-6 mt-4 border-t">
                        {childEditStep > 1 ? (
                          <Button variant="outline" onClick={() => setChildEditStep(childEditStep - 1)} disabled={childLoading}>
                            <IoArrowBack className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                        ) : (
                          <div />
                        )}
                        <div className="flex gap-2">
                          {childEditStep === 2 && (
                            <Button variant="outline" onClick={handleChildSkip} disabled={childLoading}>
                              건너뛰기
                            </Button>
                          )}
                          {childEditStep === 3 && (
                            <Button variant="outline" onClick={handleChildSkipAndClose} disabled={childLoading}>
                              건너뛰기
                            </Button>
                          )}
                          {childEditStep < 3 ? (
                            <Button onClick={handleChildNext} disabled={childLoading}>
                              {childLoading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />저장 중...</>
                              ) : (
                                <>다음 단계<IoArrowForward className="h-4 w-4 ml-2" /></>
                              )}
                            </Button>
                          ) : (
                            <Button onClick={handleChildComplete} disabled={childLoading}>
                              {childLoading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />저장 중...</>
                              ) : (
                                <>완료<IoCheckmarkCircle className="h-4 w-4 ml-2" /></>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── 가입 현황 탭 ── */}
            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IoSettings className="h-5 w-5" />
                    회원가입 현황
                  </CardTitle>
                  <CardDescription>
                    회원가입 단계별 진행 상황을 확인할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">현재 상태</h3>
                        <p className="text-sm text-gray-600">회원가입 진행 상황</p>
                      </div>
                      {getSignupStatusBadge()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">1단계: 아이 정보 (필수)</h4>
                        <p className="text-sm text-gray-600">기본정보 및 세부정보</p>
                        <Badge variant={isStep1Completed() ? 'default' : 'outline'} className="mt-2">
                          {isStep1Completed() ? '완료' : '미완료'}
                        </Badge>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">2단계: 추가 정보 (선택)</h4>
                        <p className="text-sm text-gray-600">진단여부, 치료현황</p>
                        <Badge variant={isStep2Completed() ? 'default' : 'outline'} className="mt-2">
                          {isStep2Completed() ? '완료' : '선택사항'}
                        </Badge>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">3단계: 관심사 (선택)</h4>
                        <p className="text-sm text-gray-600">관심분야 설정</p>
                        <Badge variant={isStep3Completed() ? 'default' : 'outline'} className="mt-2">
                          {isStep3Completed() ? '완료' : '선택사항'}
                        </Badge>
                      </div>
                    </div>
                    {!isStep1Completed() && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">추가 정보 입력</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          더 정확한 전문가 매칭을 위해 추가 정보를 입력해보세요.
                        </p>
                        <Button size="sm" onClick={() => router.push('/signup/client/step1')}>
                          정보 입력 계속하기
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
