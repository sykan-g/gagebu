import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // SQL을 직접 실행
    const sql = `
      CREATE TABLE IF NOT EXISTS public.entries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount BIGINT NOT NULL,
        category TEXT NOT NULL,
        memo TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error } = await supabase.sql(sql);

    if (error && !error.message.includes('already exists')) {
      console.error('테이블 생성 오류:', error);
      return NextResponse.json(
        {
          message: '테이블 생성 시도 (오류 무시 가능)',
          error: error?.message,
          status: 'warning'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: '✅ Supabase 테이블이 준비되었습니다!',
      status: 'success'
    });
  } catch (err) {
    console.error('Setup 오류:', err);

    // 백업: REST API로 직접 테이블 생성 시도
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          },
          body: JSON.stringify({
            sql: `CREATE TABLE IF NOT EXISTS public.entries (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              date DATE NOT NULL,
              type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
              amount BIGINT NOT NULL,
              category TEXT NOT NULL,
              memo TEXT DEFAULT '',
              created_at TIMESTAMPTZ DEFAULT NOW()
            );`
          })
        }
      );

      if (response.ok) {
        return NextResponse.json({
          message: '✅ 테이블 생성 완료!',
          status: 'success'
        });
      }
    } catch (fetchErr) {
      console.error('REST API 오류:', fetchErr);
    }

    return NextResponse.json({
      message: '⚠️ Supabase 대시보드에서 수동으로 테이블을 생성해주세요',
      status: 'manual_required'
    }, { status: 200 });
  }
}
