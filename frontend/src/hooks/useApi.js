import { useState, useCallback } from "react";

/**
 * API 호출 공통 로직을 처리하는 커스텀 훅
 * @param {Function} apiFunc 실제 API 호출을 수행하는 함수
 * @param {Object} options 초기값 및 콜백 옵션
 */
export function useApi(apiFunc, options = {}) {
  const { 
    initialData = null, 
    onSuccess = null, 
    onError = null 
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      // axios response인 경우 data 추출, 아니면 결과 그대로 사용
      const resultData = response?.data !== undefined ? response.data : response;
      setData(resultData);
      if (onSuccess) onSuccess(resultData);
      return resultData;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Request failed";
      setError(errMsg);
      if (onError) onError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    request,
    reset,
    setData // 필요시 수동 업데이트용
  };
}
