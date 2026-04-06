package com.wavemaker.when_to_work.updateShift.service;


import com.wavemaker.when_to_work.updateShift.model.*;
import com.wavemaker.when_to_work.updateShift.model.RootRequest;
import com.wavemaker.when_to_work.updateShift.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface UpdateShiftService {

  /**
   * 
   * 
    * @param shiftId  (required)
    * @param body RequestBody (optional)
   * @return RootResponse
   */
  @RequestLine("PUT /scheduling/shifts/{shiftId}")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",  })
  RootResponse invoke(@Param("shiftId") String shiftId, RootRequest body);

}
