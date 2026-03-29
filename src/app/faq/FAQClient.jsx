'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IoChevronDown, IoChevronUp, IoHelpCircle } from 'react-icons/io5';

export function FAQClient({ faqCategories }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {/* 페이지 헤더 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
        <div className="max-w-6xl mx-auto text-center">
          <IoHelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">자주 묻는 질문</h1>
          <p className="text-gray-600">셸메이트 서비스에 대해 궁금하신 점을 확인해보세요</p>
        </div>
      </section>

      {/* FAQ 목록 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.category}</h2>
              <div className="space-y-3">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openIndex === globalIndex;

                  return (
                    <Card key={faqIndex} className="overflow-hidden">
                      <CardHeader
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleFAQ(globalIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-900 pr-4">
                            Q. {faq.question}
                          </CardTitle>
                          {isOpen ? (
                            <IoChevronUp className="h-5 w-5 text-gray-500 shrink-0" />
                          ) : (
                            <IoChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      {isOpen && (
                        <CardContent className="pt-4 border-t">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            답변을 찾지 못하셨나요?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            고객센터로 문의해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              고객센터 문의
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
