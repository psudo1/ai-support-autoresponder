import { NextRequest, NextResponse } from 'next/server';
import { getAISettings, updateAISettings } from '@/lib/settingsService';

/**
 * GET /api/settings/ai
 * Get AI settings
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getAISettings();
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/ai
 * Update AI settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings, updated_by } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    await updateAISettings(settings, updated_by);
    const updatedSettings = await getAISettings();

    return NextResponse.json(
      { settings: updatedSettings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

