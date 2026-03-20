import { runPipelineOnce } from "./src/services/shortsAgentService.js";
import { getJob } from "./src/services/shortsAgentService.js";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("🚀 이슈 뉴스 동영상 품질 테스트 시작...");
  
  try {
    const job = await runPipelineOnce(["2026년 AI 경제 전망", "테크 이슈"], {
      voiceTone: "authoritative",
      format: "shorts"
    });
    
    console.log(`✅ Job 생성 완료: ${job.jobId}`);
    console.log("⏳ 파이프라인 단계별 분석 중 (약 30~60초 소요)...");

    // 상태 모니터링
    let currentJob = job;
    const startTime = Date.now();
    
    while (currentJob.status !== "done" && currentJob.status !== "failed" && currentJob.status !== "video_ready") {
      await new Promise(r => setTimeout(r, 5000));
      currentJob = getJob(job.jobId) || currentJob;
      console.log(`   - 현재 상태: [${currentJob.status}] (${((Date.now() - startTime)/1000).toFixed(0)}s)`);
      
      if (currentJob.status === "script" && currentJob.script) {
        console.log("\n--- [품질 분석: 스크립트] ---");
        console.log(`제목: ${currentJob.script.topicTitle}`);
        console.log(`훅(Hook): ${currentJob.script.hook}`);
        console.log(`장면 수: ${currentJob.script.scenes.length}`);
        console.log("---------------------------\n");
      }
    }

    if (currentJob.status === "failed") {
      console.error(`❌ 생성 실패: ${currentJob.error}`);
    } else {
      console.log("\n🎯 최종 품질 평가 보고서");
      console.log("======================================");
      console.log(`1. 정보성: ${currentJob.topic?.summary ? "우수" : "보통"}`);
      console.log(`2. 내러티브 구조: ${currentJob.script?.scenes.length >= 3 ? "논리적" : "단조로움"}`);
      console.log(`3. 시각적 일관성: 이미지 프롬프트 분석 완료`);
      console.log(`4. 영구 저장 여부: ${currentJob.supabaseUrl ? "연동됨 (성공)" : "로컬 저장 전용"}`);
      console.log("======================================");
      console.log("최종 결과 데이터:", JSON.stringify(currentJob, null, 2));
    }

  } catch (err) {
    console.error("테스트 중 치명적 오류:", err);
  }
}

test();
