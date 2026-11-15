import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Screen from '../src/components/Screen';
import Text from '../src/components/Text';
import { Loading, ErrorState } from '../src/components/EmptyState';
import { getLegal } from '../src/lib/api';

export default function Legal() {
  const { type } = useLocalSearchParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await getLegal();
      setDoc(all.find((d) => d.document_type === type) || null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [type]);

  const title = type === 'privacy' ? 'سياسة الخصوصية' : 'الشروط والأحكام';
  return (
    <Screen title={title} back>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 8 }}>
          <Text>{doc ? doc.content : 'لا يوجد نص منشور حالياً.'}</Text>
          {doc ? (
            <Text variant="caption" muted>
              الإصدار {doc.version}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
